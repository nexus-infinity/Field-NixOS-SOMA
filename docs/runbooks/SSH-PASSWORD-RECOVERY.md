# SSH and Password Recovery Guide for BearsiMac

## Overview

This guide provides step-by-step instructions for recovering SSH access and resetting passwords on the BearsiMac system when you're locked out or experiencing authentication issues.

## Common Issues and Solutions

### Issue 1: Password Not Accepted After Installation

**Symptoms:**
- Cannot log in locally as `jbear` with the password you thought you set
- Cannot log in as `root` locally
- SSH authentication fails

**Diagnosis:**
The `initialPassword` in the NixOS configuration may not have been properly applied during installation.

**Solution: Reset Password via Chroot from Installer USB**

#### Step 1: Boot from Installer USB
1. Insert the NixOS installer USB drive
2. Restart the iMac
3. Hold the **Option/Alt key** during startup
4. Select the USB installer from the boot menu

#### Step 2: Mount the Installed System
```bash
# Identify your root partition (replace UUIDs with your actual values)
# Check with: lsblk or sudo blkid

# Mount the root filesystem
sudo mount /dev/disk/by-uuid/5255a855-3f70-45ff-bd4f-895e336d9f52 /mnt

# Mount the boot partition
sudo mount /dev/disk/by-uuid/294E-649E /mnt/boot

# If you have a split HDD/SSD setup, also mount:
# sudo mount /dev/sda1 /mnt/nix/store  # if /nix/store is on HDD
# sudo mount /dev/sda2 /mnt/home       # if /home is on HDD
```

#### Step 3: Chroot into the Installed System
```bash
# Chroot into the installed system
sudo nixos-enter --root /mnt

# You are now inside your installed system as root
```

#### Step 4: Reset the User Password
```bash
# Reset password for user jbear
passwd jbear

# Enter your new password when prompted
# Confirm the password
```

#### Step 5: Verify Configuration (While in Chroot)
```bash
# Check if SSH is enabled
grep -r "openssh" /etc/nixos/

# Verify user configuration
grep -A 10 "users.users.jbear" /etc/nixos/configuration.nix

# Check firewall settings
grep -A 5 "firewall" /etc/nixos/configuration.nix
```

#### Step 6: Exit Chroot and Reboot
```bash
# Exit the chroot environment
exit

# Unmount all filesystems
sudo umount -R /mnt

# Reboot
reboot
```

#### Step 7: Remove USB and Test Login
1. Remove the USB installer
2. Let the system boot normally from the internal drive
3. Try logging in with your new password

### Issue 2: SSH Connection Refused or Timeout

**Symptoms:**
- `ssh jbear@<IP>` times out or connection refused
- SSH service not responding

**Diagnosis:**
SSH service may not be running, or firewall is blocking port 22.

**Solution:**

#### Check SSH Service Status
```bash
# Log in locally first
sudo systemctl status sshd

# If not running, start it
sudo systemctl start sshd

# Enable it to start on boot
sudo systemctl enable sshd
```

#### Check Firewall Configuration
```bash
# Check if port 22 is open
sudo iptables -L -n | grep 22

# Check NixOS firewall configuration
grep -A 5 "firewall" /etc/nixos/configuration.nix
```

#### Verify Network Connectivity
```bash
# Get your IP address
ip addr show

# Test from another machine
ping <your-imac-ip>

# Check if SSH port is listening
sudo ss -tlnp | grep :22
```

### Issue 3: "Permission Denied (publickey)" Error

**Symptoms:**
- SSH rejects password authentication
- Only prompts for SSH key

**Diagnosis:**
Password authentication may be disabled in SSH configuration.

**Solution:**

#### Check SSH Configuration
```bash
# View current SSH configuration
sudo cat /etc/ssh/sshd_config | grep PasswordAuthentication

# Check NixOS openssh settings
grep -A 10 "openssh" /etc/nixos/configuration.nix
```

#### Enable Password Authentication
Edit your NixOS configuration:
```nix
# In /etc/nixos/configuration.nix or nixosConfigurations/BearsiMac/configuration.nix
services.openssh = {
  enable = true;
  settings = {
    PermitRootLogin = "no";
    PasswordAuthentication = true;  # Enable password auth
  };
};
```

Then rebuild:
```bash
sudo nixos-rebuild switch --flake /etc/nixos#BearsiMac
# or
cd ~/iNixOS-Willowie && sudo nixos-rebuild switch --flake .#BearsiMac
```

### Issue 4: Cannot Use `sudo` After Login

**Symptoms:**
- User `jbear` can log in but cannot run `sudo` commands
- "user is not in the sudoers file"

**Diagnosis:**
User is not in the `wheel` group.

**Solution:**

#### Verify Group Membership
```bash
# Check current groups
groups

# Check if wheel group exists
grep wheel /etc/group
```

#### Add User to Wheel Group (via Chroot if Needed)
Boot from USB, chroot into system:
```bash
# Add user to wheel group
usermod -aG wheel jbear

# Verify
id jbear
```

Or fix declaratively in NixOS configuration:
```nix
users.users.jbear = {
  isNormalUser = true;
  extraGroups = [ "wheel" "networkmanager" ];  # Ensure wheel is included
  shell = pkgs.zsh;
  initialPassword = "nixos";
};
```

Then rebuild the configuration.

## Best Practices for Password Security

### 1. Use Hashed Passwords Instead of Initial Passwords

**Generate a hashed password:**
```bash
# On the system or in the installer
mkpasswd -m sha-512
# Enter your password when prompted
# Copy the output hash
```

**Update your NixOS configuration:**
```nix
users.users.jbear = {
  isNormalUser = true;
  extraGroups = [ "wheel" "networkmanager" ];
  shell = pkgs.zsh;
  # Use hashedPassword instead of initialPassword
  hashedPassword = "$6$rounds=656000$...your-hash-here...";
  # Remove or comment out: initialPassword = "nixos";
};
```

**Rebuild:**
```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

### 2. Set Up SSH Key Authentication

**On your client machine (laptop, desktop):**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to clipboard
cat ~/.ssh/id_ed25519.pub
```

**Add to NixOS configuration:**
```nix
users.users.jbear = {
  isNormalUser = true;
  extraGroups = [ "wheel" "networkmanager" ];
  shell = pkgs.zsh;
  openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxx... your-email@example.com"
  ];
};
```

**Rebuild and test:**
```bash
sudo nixos-rebuild switch --flake .#BearsiMac

# From client machine
ssh jbear@<imac-ip>
```

### 3. Disable Password Authentication After Setting Up Keys

**Update SSH configuration:**
```nix
services.openssh = {
  enable = true;
  settings = {
    PermitRootLogin = "no";
    PasswordAuthentication = false;  # Disable password auth for security
  };
};
```

**Rebuild:**
```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

## Verification Checklist

After recovering access or changing passwords, verify:

- [ ] **Can log in locally** as `jbear` with the new password
- [ ] **Can use sudo**: `sudo whoami` returns "root"
- [ ] **SSH service is running**: `systemctl status sshd` shows "active (running)"
- [ ] **Firewall allows SSH**: `sudo iptables -L -n | grep 22` shows port 22 allowed
- [ ] **Can SSH from another machine**: `ssh jbear@<imac-ip>` succeeds
- [ ] **SSH accepts password**: No "permission denied (publickey)" error
- [ ] **Network is accessible**: Can ping external hosts
- [ ] **Configuration is correct**: `/etc/nixos/configuration.nix` has proper openssh settings

## Configuration Reference

### Current BearsiMac SSH Configuration

Location: `nixosConfigurations/BearsiMac/configuration.nix`

```nix
# Networking and Firewall
networking = {
  hostName = "BearsiMac";
  networkmanager.enable = true;
  firewall = {
    enable = true;
    allowedTCPPorts = [ 22 ];  # SSH
  };
};

# SSH Service
services.openssh = {
  enable = true;
  settings = {
    PermitRootLogin = "no";          # Root cannot SSH in
    PasswordAuthentication = true;    # Allow password login (for initial setup)
  };
};

# User Account
users.users.jbear = {
  isNormalUser = true;
  extraGroups = [ "wheel" "networkmanager" ];
  shell = pkgs.zsh;
  initialPassword = "nixos";  # Change immediately!
};
```

### Finding Your System's UUIDs

If you need to mount partitions but don't know the UUIDs:

```bash
# List all block devices with UUIDs
sudo blkid

# List all partitions
lsblk -f

# For BearsiMac specifically (from hardware-configuration.nix):
# Root: /dev/disk/by-uuid/5255a855-3f70-45ff-bd4f-895e336d9f52
# Boot: /dev/disk/by-uuid/294E-649E
```

## Emergency Recovery Procedures

### If NixOS Won't Boot At All

1. Boot from USB installer
2. Mount your filesystems (see step 2 above)
3. Chroot into the system
4. Check recent configuration changes:
   ```bash
   cd /etc/nixos
   git log --oneline -10
   git diff HEAD~1
   ```
5. Rollback to previous generation:
   ```bash
   # List generations
   nix-env --list-generations --profile /nix/var/nix/profiles/system

   # Set default to previous generation
   nix-env --profile /nix/var/nix/profiles/system --switch-generation <number>

   # Update bootloader
   /nix/var/nix/profiles/system/bin/switch-to-configuration boot
   ```
6. Exit chroot, unmount, and reboot

### If You Forgot All Passwords

1. Boot from USB installer
2. Mount and chroot (see steps above)
3. Reset password for `jbear`: `passwd jbear`
4. Optionally set a root password (not recommended): `passwd root`
5. Exit, unmount, reboot

## Troubleshooting Tools

### Useful Commands

```bash
# Check if SSH is listening
sudo ss -tlnp | grep :22
sudo netstat -tlnp | grep :22

# Test SSH locally
ssh jbear@localhost

# Check SSH logs
sudo journalctl -u sshd -f

# Check authentication logs
sudo journalctl -t sshd | grep -i auth

# Test SSH configuration syntax
sudo sshd -t

# View effective SSH config
sudo sshd -T

# Check user groups
id jbear
groups jbear

# Check if wheel group can use sudo
sudo grep wheel /etc/sudoers /etc/sudoers.d/*
```

### Network Diagnostics

```bash
# Get IP address
ip addr show
hostname -I

# Check routing
ip route show

# Check DNS
cat /etc/resolv.conf

# Test connectivity
ping -c 3 8.8.8.8
ping -c 3 google.com

# Check firewall rules
sudo iptables -L -n -v
```

## Related Documentation

- [Installation Flow](../INSTALLATION-FLOW.md) - Initial installation process
- [Post-Installation Checklist](../POST-INSTALLATION-CHECKLIST.md) - Verification steps
- [First Boot Guide](../FIRST-BOOT-README.md) - Initial setup procedures
- [iMac 2019 Fusion Drive Setup](../IMAC-2019-FUSION-DRIVE-SETUP.md) - Hardware configuration

## Support

If you continue to experience issues after following this guide:

1. Check NixOS logs: `journalctl -xe`
2. Review SSH logs: `journalctl -u sshd -n 50`
3. Verify configuration builds: `sudo nixos-rebuild dry-build --flake .#BearsiMac`
4. Check for syntax errors: `nix flake check`
5. Consult NixOS manual: https://nixos.org/manual/nixos/stable/

---

**Last Updated:** 2025-11-12
**System:** BearsiMac (iMac 2019)
**Configuration:** Field-NixOS-SOMA
