# First Boot Guide - Field-NixOS-SOMA

## Welcome to Field-NixOS-SOMA

This guide will help you complete the first boot and initial setup of your Field-NixOS-SOMA system.

## What to Expect

Your Field-NixOS-SOMA system is a **stateless, reproducible** NixOS configuration that:
- Contains no user data (clean system)
- Is fully managed by Nix flakes
- Implements the SOMA octahedron architecture
- Provides chakra-based service organization

## First Boot Checklist

### Immediate Actions (First 5 Minutes)

- [ ] **Boot the system**
- [ ] **Login** (credentials should be configured during installation)
- [ ] **Verify network connectivity**: `ping nixos.org`
- [ ] **Check system version**: `nixos-version`
- [ ] **Verify configuration path**: `readlink /run/current-system`

### Initial Verification (Next 10 Minutes)

#### 1. Check System Status

```bash
# View system information
nixos-version
uname -a

# Check services
systemctl status

# List failed services (should be none or minimal)
systemctl --failed
```

#### 2. Verify Network Configuration

```bash
# Check network interfaces
ip addr show

# Test internet connectivity
ping -c 3 nixos.org
ping -c 3 1.1.1.1

# Verify DNS
nslookup google.com
```

#### 3. Verify NixOS Configuration

```bash
# Go to configuration directory
cd /etc/nixos

# Verify it's a flake
test -f flake.nix && echo "✓ Flake-based" || echo "✗ Not flake-based"

# Show flake info
nix flake show

# Test rebuild (dry-run)
sudo nixos-rebuild dry-build --flake .#$(hostname)
```

#### 4. Check SOMA Services (if applicable)

```bash
# Check which SOMA services are enabled
systemctl list-units --type=service | grep soma

# Check individual service status
systemctl status soma-* | grep "Active:"
```

### Configuration (Next 30 Minutes)

#### 1. Set Up User Account (if not configured)

If you need to create a user account:

```bash
# Add user (as root)
sudo useradd -m -G wheel -s /bin/bash your-username

# Set password
sudo passwd your-username

# Or configure declaratively in NixOS config and rebuild
```

**Note**: For stateless deployments, user configuration should be in your NixOS configuration, not manually created.

#### 2. Configure SSH (if needed)

```bash
# Generate SSH keys
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add public key to authorized_keys if needed
# Or configure in NixOS configuration
```

#### 3. Update System (if needed)

```bash
cd /etc/nixos

# Update flake inputs
nix flake update

# Review changes
git diff flake.lock

# Test build
sudo nixos-rebuild dry-build --flake .#$(hostname)

# Apply updates
sudo nixos-rebuild switch --flake .#$(hostname)
```

### Validation (Final 15 Minutes)

#### 1. Run Validation Scripts

```bash
cd /etc/nixos

# Run environment evaluation
./scripts/evaluate-environment.sh

# Run pre-deployment check (should pass)
./scripts/pre-deployment-check.sh
```

#### 2. Verify No User Data

```bash
# Check /home (should be empty or minimal)
ls -la /home/

# Should have no personal files
find /home -type f 2>/dev/null | wc -l
```

#### 3. Test Rebuild

```bash
# Verify system can rebuild itself
sudo nixos-rebuild dry-build --flake /etc/nixos#$(hostname)

# If successful, the system is properly configured
```

## Common Configuration Tasks

### Adding Packages

**Do NOT install packages with `nix-env`** - this breaks reproducibility.

Instead, add packages to your NixOS configuration:

```nix
# In /etc/nixos/nixosConfigurations/<hostname>/configuration.nix
environment.systemPackages = with pkgs; [
  vim
  git
  htop
  # Add your packages here
];
```

Then rebuild:

```bash
sudo nixos-rebuild switch --flake /etc/nixos#$(hostname)
```

### Enabling Services

Add service configuration to your NixOS config:

```nix
# In configuration.nix
services.openssh = {
  enable = true;
  settings.PasswordAuthentication = false;
};
```

Then rebuild:

```bash
sudo nixos-rebuild switch --flake /etc/nixos#$(hostname)
```

### Adding Users

Add users declaratively:

```nix
# In configuration.nix
users.users.myuser = {
  isNormalUser = true;
  extraGroups = [ "wheel" "networkmanager" ];
  openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAA... your-key-comment"
  ];
};
```

Then rebuild:

```bash
sudo nixos-rebuild switch --flake /etc/nixos#$(hostname)
```

## Configuration Locations

### Main Configuration

- **Flake**: `/etc/nixos/flake.nix`
- **Machine Config**: `/etc/nixos/nixosConfigurations/<hostname>/configuration.nix`
- **Hardware Config**: `/etc/nixos/hardware-configuration.nix`

### Module Locations

- **Services**: `/etc/nixos/modules/services/`
- **System**: `/etc/nixos/modules/system/`
- **Chakras**: `/etc/nixos/chakras/`

### Scripts

- **Validation**: `/etc/nixos/scripts/pre-deployment-check.sh`
- **Evaluation**: `/etc/nixos/scripts/evaluate-environment.sh`
- **Image Building**: `/etc/nixos/scripts/build-image.sh`

### Documentation

- **Runbooks**: `/etc/nixos/docs/runbooks/`
- **Main README**: `/etc/nixos/README.md`

## Troubleshooting

### System Won't Boot

1. **Boot into previous generation**:
   - At boot menu, select previous system generation
   - Once booted, investigate configuration issues

2. **Check boot logs**:
   ```bash
   journalctl -b
   ```

### Services Fail to Start

```bash
# Check specific service
sudo systemctl status <service-name>

# View service logs
sudo journalctl -u <service-name> -n 50

# Restart service
sudo systemctl restart <service-name>
```

### Network Issues

```bash
# Check network manager
sudo systemctl status NetworkManager

# Restart networking
sudo systemctl restart NetworkManager

# Check network interfaces
ip addr show

# Test connectivity
ping -c 3 1.1.1.1
```

### Configuration Rebuild Fails

```bash
# Check syntax errors
nix flake check

# Evaluate configuration without building
nix eval .#nixosConfigurations.<hostname>.config.system.build.toplevel

# Build without switching
sudo nixos-rebuild dry-build --flake .#<hostname>

# Check for missing modules
ls -la modules/
```

## Understanding SOMA Architecture

Field-NixOS-SOMA implements a unique architecture:

### Chakra System
- **9 Chakras**: Muladhara, Svadhisthana, Manipura, Anahata, Vishuddha, Ajna, Sahasrara, Soma, Jnana
- Each chakra is a module providing specific functionality
- Organized as petals in a hexagonal hive structure

### Sacred Geometry
- **Metatron Cube**: Central translator/bridge
- **Octahedron**: SOMA architecture pattern
- **Prime Petals**: Fractal recursive structure

### Ubuntu Philosophy
- "I am because we are" (Umuntu ngumuntu ngabantu)
- Collective consciousness over individual authority
- 5/8 consensus mechanism

See `/etc/nixos/docs/SOMA-ARCHITECTURE.md` for details.

## Next Steps

After completing first boot:

1. **Customize configuration** for your needs
2. **Set up secrets management** (sops-nix or agenix)
3. **Configure backup strategy**
4. **Document any customizations**
5. **Join the community** (if available)

## Maintenance Schedule

### Daily
- Check `systemctl status` for failed services
- Review system logs: `journalctl -p 3 -b` (errors)

### Weekly
- Update flake inputs: `nix flake update`
- Test build: `sudo nixos-rebuild dry-build`
- Review changes before applying

### Monthly
- Clean old generations: `sudo nix-collect-garbage -d`
- Optimize store: `nix-store --optimize`
- Update documentation

## Getting Help

### Documentation
- `/etc/nixos/docs/` - Local documentation
- `/etc/nixos/README.md` - Main README
- `/etc/nixos/docs/runbooks/` - Operational procedures

### Resources
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [NixOS Wiki](https://nixos.wiki/)
- [Nix Package Search](https://search.nixos.org/)
- [Field-NixOS-SOMA Repository](https://github.com/nexus-infinity/Field-NixOS-SOMA)

### Community
- GitHub Issues: Report bugs or request features
- GitHub Discussions: Ask questions

## Important Reminders

⚠️ **Always commit configuration changes to git**
```bash
cd /etc/nixos
git add .
git commit -m "Description of changes"
git push
```

⚠️ **Never edit system files directly**
- Use NixOS configuration only
- All changes should be reproducible

⚠️ **Test before applying**
```bash
sudo nixos-rebuild dry-build --flake .#<hostname>
```

⚠️ **Keep secrets encrypted**
- Use sops-nix or agenix
- Never commit plaintext secrets

---

**Welcome to the Field-NixOS-SOMA collective consciousness!**

May your deployment be stable and your configuration reproducible. 🌀
