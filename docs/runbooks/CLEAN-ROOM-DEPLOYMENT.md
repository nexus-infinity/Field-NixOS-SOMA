# Clean-Room Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying Field-NixOS-SOMA in a "clean-room" environment - a stateless, reproducible, deployment-ready NixOS configuration with zero user data, managed entirely as code.

## Prerequisites

### Required Tools
- NixOS installation media (USB/ISO)
- Git (for cloning repository)
- Network connectivity
- Target hardware (or VM for testing)

### Knowledge Requirements
- Basic NixOS concepts (flakes, modules, system configuration)
- Understanding of the SOMA architecture
- Familiarity with command-line operations

## Deployment Phases

### Phase 1: Pre-Deployment Validation

**Objective**: Verify the configuration repository is clean and deployment-ready.

#### Step 1.1: Clone Repository

```bash
git clone https://github.com/nexus-infinity/Field-NixOS-SOMA.git
cd Field-NixOS-SOMA
```

#### Step 1.2: Run Pre-Deployment Checks

```bash
./scripts/pre-deployment-check.sh
```

**Expected Results**:
- ✅ No critical errors
- ✅ No user data detected
- ✅ No secrets in git tracking
- ✅ Flake-managed configuration verified

**If checks fail**:
1. Review error messages carefully
2. Fix critical issues before proceeding
3. Re-run checks until passing

#### Step 1.3: Verify Directory Structure

```bash
ls -la
```

**Expected Structure**:
```
chakras/          # Chakra modules (spiritual/conceptual organization)
modules/          # System and service modules
  services/       # Service definitions
  system/         # System configurations
hardware/         # Hardware-specific configurations
overlays/         # Nix package overlays
secrets/          # Encrypted secrets (README only in git)
scripts/          # Validation and deployment scripts
docs/             # Documentation
  runbooks/       # This file
flake.nix         # Main flake configuration
```

### Phase 2: Target System Preparation

**Objective**: Prepare the target hardware for NixOS installation.

#### Step 2.1: Boot from NixOS Installation Media

1. Create NixOS installation USB:
   ```bash
   # On a Linux system with the ISO
   sudo dd if=nixos-minimal-xx.xx.iso of=/dev/sdX bs=4M status=progress
   sync
   ```

2. Boot target system from USB
3. Select "NixOS Installer" from boot menu

#### Step 2.2: Set Up Networking

```bash
# For wired connection (usually automatic)
ping -c 3 nixos.org

# For WiFi
sudo systemctl start wpa_supplicant
wpa_cli
> add_network
> set_network 0 ssid "YOUR_SSID"
> set_network 0 psk "YOUR_PASSWORD"
> enable_network 0
> quit
```

#### Step 2.3: Partition Disks

**⚠️ CAUTION**: This will erase all data on the target disk.

```bash
# Identify disks
lsblk

# Example for /dev/sda (adjust as needed)
sudo parted /dev/sda -- mklabel gpt
sudo parted /dev/sda -- mkpart primary 512MiB 100%
sudo parted /dev/sda -- mkpart ESP fat32 1MiB 512MiB
sudo parted /dev/sda -- set 2 esp on

# Format partitions
sudo mkfs.ext4 -L nixos /dev/sda1
sudo mkfs.fat -F 32 -n boot /dev/sda2

# Mount partitions
sudo mount /dev/disk/by-label/nixos /mnt
sudo mkdir -p /mnt/boot
sudo mount /dev/disk/by-label/boot /mnt/boot
```

For Fusion Drive (iMac 2019), see [../IMAC-2019-FUSION-DRIVE-SETUP.md](../IMAC-2019-FUSION-DRIVE-SETUP.md).

### Phase 3: Configuration Deployment

**Objective**: Deploy the Field-NixOS-SOMA configuration to the target system.

#### Step 3.1: Generate Hardware Configuration

```bash
sudo nixos-generate-config --root /mnt
```

This creates `/mnt/etc/nixos/configuration.nix` and `/mnt/etc/nixos/hardware-configuration.nix`.

#### Step 3.2: Clone Repository to Target

```bash
cd /mnt/etc
sudo rm -rf nixos  # Remove generated config
sudo git clone https://github.com/nexus-infinity/Field-NixOS-SOMA.git nixos
cd nixos
```

#### Step 3.3: Extract Hardware Configuration

```bash
# Copy the generated hardware config to appropriate location
sudo nixos-generate-config --show-hardware-config > hardware-configuration.nix
```

**Or** for organized structure:

```bash
sudo nixos-generate-config --show-hardware-config > hardware/$(hostname)/hardware-configuration.nix

# Update flake.nix to reference:
# ./hardware/$(hostname)/hardware-configuration.nix
```

#### Step 3.4: Select Target Configuration

Choose the appropriate system configuration:

- `BearsiMac` - Original iMac 2019 configuration
- `willowie` - Willowie consciousness system
- `soma-willowie` - Full SOMA Ubuntu collective consciousness
- `trident-dev` - Trident Scrum development workspace

#### Step 3.5: Install NixOS

```bash
# From /mnt/etc/nixos
sudo nixos-install --flake .#BearsiMac
# Or: .#willowie, .#soma-willowie, .#trident-dev
```

**Expected Output**:
- Configuration evaluation succeeds
- All packages download successfully
- System builds without errors
- Root password prompt (set a secure password)

### Phase 4: First Boot Validation

**Objective**: Verify the system boots correctly and is properly configured.

#### Step 4.1: Reboot into New System

```bash
sudo reboot
```

Remove installation media when prompted.

#### Step 4.2: Login and Verify

```bash
# Login as root (or configured user)

# Verify NixOS version
nixos-version

# Check system state
systemctl status

# Verify no user data
ls -la /home  # Should be empty or only system users
```

#### Step 4.3: Run Post-Deployment Validation

```bash
cd /etc/nixos
./scripts/evaluate-environment.sh
./scripts/pre-deployment-check.sh
```

**Expected Results**:
- ✅ All services started
- ✅ No errors in system logs
- ✅ Configuration evaluates cleanly
- ✅ No user data detected

### Phase 5: Stateless Verification

**Objective**: Confirm the system is truly stateless and reproducible.

#### Step 5.1: Verify No User Content

```bash
# Check /home directory
sudo find /home -type f 2>/dev/null | wc -l  # Should be 0 or minimal

# Check for user-specific configs
sudo find /home -name ".bash_history" -o -name ".zsh_history" 2>/dev/null
```

**Expected**: No user-specific files.

#### Step 5.2: Verify Flake-Managed

```bash
cd /etc/nixos

# Verify flake
nix flake show

# Test rebuild
sudo nixos-rebuild dry-build --flake .#BearsiMac
```

**Expected**: Clean rebuild without errors.

#### Step 5.3: Verify No Secrets Leaked

```bash
cd /etc/nixos

# Scan for secrets
./scripts/pre-deployment-check.sh | grep -i "secret\|password\|key"
```

**Expected**: No secrets in tracked files.

### Phase 6: Image Export (Optional)

**Objective**: Create a deployable system image for rapid deployment.

#### Step 6.1: Install nixos-generators

```bash
nix-shell -p nixos-generators
```

#### Step 6.2: Build Image

```bash
cd /etc/nixos

# Build ISO image
nixos-generate -f iso --flake .#BearsiMac

# Or build VM image
nixos-generate -f vm --flake .#BearsiMac

# Or build cloud image
nixos-generate -f amazon --flake .#BearsiMac
```

**Output**: Image file in `./result/`

#### Step 6.3: Test Image (VM)

```bash
# Run the generated VM
./result/bin/run-*-vm
```

## Validation Checklist

Before considering deployment complete:

- [ ] **System boots successfully**
- [ ] **No user data in /home**
- [ ] **All services start correctly**
- [ ] **Configuration is flake-managed**
- [ ] **No secrets in git tracking**
- [ ] **Hardware configuration generated**
- [ ] **Documentation is complete**
- [ ] **System can rebuild itself**: `sudo nixos-rebuild switch --flake .#<config>`
- [ ] **Image export works** (if applicable)
- [ ] **Pre-deployment checks pass**

## Troubleshooting

### Issue: "error: getting status of '/etc/nixos/hardware-configuration.nix': No such file or directory"

**Solution**: 
```bash
sudo nixos-generate-config --show-hardware-config > /etc/nixos/hardware-configuration.nix
```

### Issue: "error: experimental Nix feature 'flakes' is disabled"

**Solution**:
```bash
# Add to /etc/nix/nix.conf or ~/.config/nix/nix.conf
experimental-features = nix-command flakes
```

Then restart nix-daemon:
```bash
sudo systemctl restart nix-daemon
```

### Issue: Build fails due to missing module

**Solution**: Verify all modules exist and are properly imported in `flake.nix`.

```bash
nix flake show
nix flake check
```

### Issue: Services fail to start

**Solution**: Check service logs:
```bash
sudo journalctl -u <service-name> -n 50
sudo systemctl status <service-name>
```

## Rollback Procedure

If deployment fails or issues arise:

### Step 1: Reboot into Previous Generation

```bash
# List generations
sudo nix-env --list-generations --profile /nix/var/nix/profiles/system

# Reboot and select previous generation in bootloader
sudo reboot
```

### Step 2: Verify System State

```bash
nixos-version
systemctl status
```

### Step 3: Fix and Retry

```bash
cd /etc/nixos
# Fix configuration
git status
git diff
# Test build
sudo nixos-rebuild dry-build --flake .#<config>
# If successful
sudo nixos-rebuild switch --flake .#<config>
```

## Maintenance

### Regular Updates

```bash
cd /etc/nixos
# Update flake inputs
nix flake update
# Review changes
git diff flake.lock
# Test build
sudo nixos-rebuild dry-build --flake .#<config>
# Apply
sudo nixos-rebuild switch --flake .#<config>
```

### Adding New Services

1. Create module in `modules/services/<service>.nix`
2. Import in appropriate configuration
3. Test build
4. Run pre-deployment checks
5. Deploy

### Secrets Management

1. Use sops-nix or agenix
2. Store encrypted secrets in `secrets/`
3. Never commit plaintext secrets
4. Rotate secrets regularly

## Security Considerations

### Minimal Attack Surface
- No user accounts on base system
- Services run with minimal permissions
- Regular security updates via flake updates

### Secrets Management
- All secrets encrypted at rest
- Secrets injected at deployment time
- No secrets in git history

### Audit Trail
- All changes tracked in git
- Deployment history in Nix generations
- System logs for runtime monitoring

## Reference

### Key Files
- `flake.nix` - Main system configuration
- `modules/services/` - Service definitions
- `chakras/` - Chakra-based module organization
- `scripts/pre-deployment-check.sh` - Validation script
- `docs/runbooks/` - Operational procedures

### Key Commands
- `nix flake show` - Show flake outputs
- `nix flake check` - Validate flake
- `nixos-rebuild switch --flake .#<config>` - Apply configuration
- `./scripts/pre-deployment-check.sh` - Validate deployment readiness

### Resources
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [Nix Flakes](https://nixos.wiki/wiki/Flakes)
- [Field-NixOS-SOMA Documentation](../README.md)
- [SOMA Architecture](../SOMA-ARCHITECTURE.md)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Maintainer**: Field-NixOS-SOMA Team
