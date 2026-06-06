# Installation Flow Diagram

## Overview: iMac 2019 NixOS Installation Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Boot from USB                         │
│                   (Hold Option/Alt Key)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 1: Identify Your Hardware                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Run: sudo ./scripts/detect-drives.sh                     │  │
│  │                                                            │  │
│  │  Outputs:                                                  │  │
│  │  • SSD: /dev/nvme0n1 (20-30GB)                            │  │
│  │  • HDD: /dev/sda (1TB)                                    │  │
│  │  • Recommended partitioning strategy                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 2: Choose Partitioning Strategy               │
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │   OPTION A (Recommended)│    │   OPTION B (Simpler)    │    │
│  │   ─────────────────────  │    │   ────────────────────  │    │
│  │   SSD: System Files     │    │   HDD: Everything       │    │
│  │   • /boot (512MB)       │    │   • /boot (512MB)       │    │
│  │   • / (root, ~19GB)     │    │   • swap (16GB)         │    │
│  │                         │    │   • / (root, rest)      │    │
│  │   HDD: Data & Packages  │    │                         │    │
│  │   • swap (16GB)         │    │   Best for: Simple      │    │
│  │   • /nix/store (400GB)  │    │   setups, single drive  │    │
│  │   • /home (rest)        │    │                         │    │
│  │                         │    │                         │    │
│  │   Best for: Performance │    │                         │    │
│  │   and space efficiency  │    │                         │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: Partition the Drives                       │
│  ⚠️  WARNING: This will ERASE all data!                         │
│  ⚠️  Make sure you have backups!                                │
│                                                                 │
│  Follow commands in:                                            │
│  docs/IMAC-2019-FUSION-DRIVE-SETUP.md                          │
│  (Phase 2: Partition the Drives)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 4: Format and Mount Filesystems               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Format: mkfs.fat, mkfs.btrfs, mkswap                 │  │
│  │  2. Mount root: mount /dev/.../nixos /mnt                │  │
│  │  3. Create directories: mkdir -p /mnt/boot /mnt/home     │  │
│  │  4. Mount all filesystems                                │  │
│  │  5. Enable swap: swapon /dev/.../swap                    │  │
│  │  6. VERIFY: sudo ./scripts/verify-mounts.sh              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 5: Generate Hardware Configuration              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  nixos-generate-config --root /mnt                        │  │
│  │                                                            │  │
│  │  Creates:                                                  │  │
│  │  • /mnt/etc/nixos/hardware-configuration.nix              │  │
│  │  • /mnt/etc/nixos/configuration.nix                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          STEP 6: Clone iNixOS-Willowie Repository               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  cd /mnt/home/jbear                                       │  │
│  │  git clone https://github.com/nexus-infinity/...         │  │
│  │  cd iNixOS-Willowie                                       │  │
│  │                                                            │  │
│  │  Copy generated hardware config:                          │  │
│  │  cp /mnt/etc/nixos/hardware-configuration.nix .           │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 7: Install NixOS                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  cd /mnt/home/jbear/iNixOS-Willowie                       │  │
│  │  nixos-install --flake .#BearsiMac --root /mnt            │  │
│  │                                                            │  │
│  │  This will:                                                │  │
│  │  • Download all packages (may take 10-30 minutes)         │  │
│  │  • Build the system                                       │  │
│  │  • Install bootloader                                     │  │
│  │  • Set up systemd services                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 8: Unmount and Reboot                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  umount -R /mnt                                           │  │
│  │  reboot                                                    │  │
│  │                                                            │  │
│  │  Remove USB drive!                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 9: First Boot from Internal Drive             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  System boots automatically from internal drive            │  │
│  │  • GNOME login screen appears                             │  │
│  │  • Log in as: jbear                                       │  │
│  │  • Password: nixos (change immediately!)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 10: Post-Installation Verification            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Change password: passwd                                   │  │
│  │  Connect to WiFi                                           │  │
│  │  Test SSH access (if enabled):                            │  │
│  │    ssh jbear@localhost                                    │  │
│  │    ssh jbear@<your-ip> (from another machine)            │  │
│  │  Test rebuild: cd ~/iNixOS-Willowie                       │  │
│  │                sudo nixos-rebuild test --flake .#BearsiMac │  │
│  │                                                            │  │
│  │  Complete checklist:                                       │  │
│  │  docs/POST-INSTALLATION-CHECKLIST.md                      │  │
│  │                                                            │  │
│  │  If password issues occur, see:                           │  │
│  │  docs/runbooks/SSH-PASSWORD-RECOVERY.md                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS! 🎉                                  │
│                                                                 │
│  Your iMac 2019 is now running NixOS with iNixOS-Willowie      │
│                                                                 │
│  You can now:                                                   │
│  • Boot natively from internal drives                           │
│  • Update system via nixos-rebuild                              │
│  • Roll back to previous generations                            │
│  • Manage configuration declaratively                           │
│                                                                 │
│  Next: Customize your system!                                   │
│  Edit: nixosConfigurations/BearsiMac/configuration.nix         │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting Decision Tree

```
Problem: System won't boot from internal drive
│
├─ Did installation complete successfully?
│  ├─ No → Review installation logs, try again
│  └─ Yes → Continue
│
├─ Can you see boot menu (hold Option/Alt)?
│  ├─ No → Check EFI partition was created and mounted
│  └─ Yes → Continue
│
├─ Is "EFI Boot" or internal drive listed in boot menu?
│  ├─ No → Boot loader may not be installed correctly
│  │       → Boot from USB and reinstall: nixos-install
│  └─ Yes → Select it and boot
│
└─ Does it boot but fail to start?
   ├─ Hardware error → Check logs: journalctl -xe
   ├─ Missing modules → Check hardware-configuration.nix
   └─ Service fails → Boot previous generation from menu
```

## Time Estimates

| Phase | Duration | Notes |
|-------|----------|-------|
| Preparation | 10-20 min | Boot USB, identify drives |
| Partitioning | 10-20 min | Format drives, create partitions |
| Installation | 15-45 min | Download packages, install system |
| First Boot | 5-10 min | Boot, login, verify |
| Configuration | 10-30 min | Customize, test rebuild |
| **Total** | **50-125 min** | Varies by network speed |

## Quick Reference Commands

```bash
# Identify drives
sudo ./scripts/detect-drives.sh

# Verify mounts before install
sudo ./scripts/verify-mounts.sh

# Generate hardware config
nixos-generate-config --root /mnt

# Install NixOS
nixos-install --flake .#BearsiMac --root /mnt

# Test rebuild (after installation)
sudo nixos-rebuild test --flake .#BearsiMac

# Apply configuration
sudo nixos-rebuild switch --flake .#BearsiMac

# Rollback if needed
sudo nixos-rebuild switch --rollback
```

## Key Success Factors

✅ **Backup data before starting**
✅ **Identify correct SSD/HDD devices**
✅ **Verify mounts before installing**
✅ **Copy hardware-configuration.nix to flake**
✅ **Remove USB before rebooting**
✅ **Change initial password after first login**
✅ **Complete post-installation checklist**

---

For detailed instructions at each step, see: **docs/IMAC-2019-FUSION-DRIVE-SETUP.md**
