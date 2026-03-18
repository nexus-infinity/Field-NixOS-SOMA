# Post-Installation Checklist for iMac 2019

Use this checklist after successfully installing NixOS with the iNixOS-Willowie configuration.

## ✅ Immediate Post-Installation Checks

### Boot and Access
- [ ] System boots from internal drive (no USB needed)
- [ ] Can log in as user `jbear`
- [ ] Desktop environment loads (GNOME)
- [ ] Keyboard and mouse work properly

### Network Connectivity
- [ ] WiFi connects to network
- [ ] Internet access working (`ping google.com`)
- [ ] NetworkManager service active (`systemctl status NetworkManager`)

### Storage Configuration
- [ ] Root filesystem mounted correctly (`df -h /`)
- [ ] Boot partition mounted correctly (`df -h /boot`)
- [ ] `/nix/store` on HDD (if using Fusion Drive split) (`df -h /nix/store`)
- [ ] `/home` on HDD (if using Fusion Drive split) (`df -h /home`)
- [ ] Swap active (`swapon --show`)
- [ ] Sufficient free space on all partitions

### Hardware Functionality
- [ ] Display working at correct resolution
- [ ] Graphics acceleration working (check `glxinfo | grep "direct rendering"`)
- [ ] WiFi firmware loaded (`dmesg | grep -i wifi`)
- [ ] Bluetooth working (if needed)
- [ ] Sound working (speakers/headphones)

### System Configuration
- [ ] NixOS version correct (`nixos-version`)
- [ ] Hostname set to BearsiMac (`hostname`)
- [ ] User in correct groups (`groups jbear`)
- [ ] SSH service running (if enabled) (`systemctl status sshd`)

## 📝 Configuration Repository Checks

### Repository Access
- [ ] Repository cloned to accessible location (e.g., `/home/jbear/iNixOS-Willowie`)
- [ ] Can navigate to repository (`cd ~/iNixOS-Willowie`)
- [ ] Git working (`git status`)
- [ ] Flake commands work (`nix flake show`)

### Hardware Configuration
- [ ] `hardware-configuration.nix` exists in repository
- [ ] UUIDs match actual partitions (`sudo blkid` vs file contents)
- [ ] All mount points included in hardware-configuration.nix

### Build and Rebuild
- [ ] Test build succeeds (`sudo nixos-rebuild test --flake .#BearsiMac`)
- [ ] Switch command works (`sudo nixos-rebuild switch --flake .#BearsiMac`)
- [ ] No errors during rebuild

## 🔐 Security and User Setup

### User Configuration
- [ ] Changed initial password (`passwd`)
- [ ] Verified password works for local login
- [ ] Verified password works for SSH login (if SSH enabled)
- [ ] User can use sudo (`sudo -l`)
- [ ] Shell is set to zsh (`echo $SHELL`)
- [ ] Home directory permissions correct (`ls -la ~`)

### SSH Access (if enabled)
- [ ] SSH service is running (`systemctl status sshd`)
- [ ] Firewall allows SSH port 22 (`sudo iptables -L -n | grep 22`)
- [ ] Can SSH from localhost (`ssh jbear@localhost`)
- [ ] Can SSH from another machine (`ssh jbear@<IP>`)
- [ ] Password authentication works (or SSH keys configured)
- [ ] Root login disabled (`grep PermitRootLogin /etc/ssh/sshd_config`)

### System Security
- [ ] Root password set (if using root login)
- [ ] Firewall configured (check `configuration.nix`)
- [ ] Unnecessary services disabled
- [ ] SSH key authentication set up (if using SSH)

## 💾 Backup and Recovery

### Backup Strategy
- [ ] Identified critical data locations
- [ ] Backup solution planned/configured
- [ ] External backup drive available
- [ ] Tested basic backup process

### Recovery Preparation
- [ ] Know how to rollback (`nixos-rebuild switch --rollback`)
- [ ] Can list generations (`nixos-rebuild list-generations`)
- [ ] Know how to boot old generation (boot menu)
- [ ] USB installer kept for emergencies

## 🎨 Desktop Environment

### GNOME Configuration (if using GNOME)
- [ ] GNOME extensions working
- [ ] Display scaling correct for your monitor
- [ ] Night light configured
- [ ] Keyboard shortcuts work
- [ ] File manager accessible
- [ ] Terminal accessible

### Applications
- [ ] Firefox installed and working
- [ ] Terminal emulator working
- [ ] File manager working
- [ ] Text editor accessible (vim/nano)
- [ ] Essential applications installed

## 🔧 System Maintenance

### Update Process
- [ ] Know how to update flake (`nix flake update`)
- [ ] Tested rebuild after update
- [ ] Can revert flake.lock if needed (`git checkout flake.lock`)

### Garbage Collection
- [ ] Know how to check disk usage (`df -h`)
- [ ] Can list old generations (`nix-env --list-generations --profile /nix/var/nix/profiles/system`)
- [ ] Know how to run garbage collection (`sudo nix-collect-garbage -d`)
- [ ] Tested garbage collection process

### Monitoring
- [ ] Know how to check system status (`systemctl status`)
- [ ] Can view logs (`journalctl -xe`)
- [ ] Can monitor disk space (`df -h`)
- [ ] Can check process usage (`htop`)

## 🌀 iNixOS-Willowie Specific

### Chakra System
- [ ] All 9 chakra modules loading (no errors)
- [ ] Understood chakra architecture (read `WARP.md`)
- [ ] Aware that services are stubs (warnings expected)

### Sacred Geometry Configuration
- [ ] DOJO nodes configuration present (stub)
- [ ] Atlas frontend configuration present (stub)
- [ ] Metatron Cube translator configuration present (stub)
- [ ] TATA 8i Pulse Engine configuration present (stub)

## 📚 Documentation Review

### Read and Understood
- [ ] `README-QUICKSTART.md` - Quick start guide
- [ ] `docs/IMAC-2019-FUSION-DRIVE-SETUP.md` - Installation guide
- [ ] `docs/CONFIGURATION_REVIEW.md` - Configuration details
- [ ] `WARP.md` - Architecture overview

## 🚀 Optional Enhancements

### Performance Optimization
- [ ] Enabled TRIM for SSD (`services.fstrim.enable = true`)
- [ ] Configured compression for btrfs (`compress=zstd` option)
- [ ] Enabled Nix store optimization (`nix.settings.auto-optimise-store = true`)
- [ ] Adjusted swappiness (if needed)

### Additional Software
- [ ] Installed development tools (if needed)
- [ ] Configured version control (git config)
- [ ] Set up development environment
- [ ] Installed multimedia codecs

### System Tuning
- [ ] Configured power management
- [ ] Set up scheduled tasks (if needed)
- [ ] Configured automatic updates (optional)
- [ ] Set up monitoring/logging (optional)

## ⚠️ Known Issues to Monitor

### Expected Warnings
- [ ] Stub service warnings (normal - services not yet implemented)
- [ ] Chakra service configuration warnings (expected)

### Things to Watch
- [ ] SSD filling up (if /nix/store is on SSD by mistake)
- [ ] HDD space usage (for /home and /nix/store)
- [ ] Boot time (should be reasonable, not excessively slow)
- [ ] System responsiveness (should be snappy on SSD root)

## 📞 Support Resources

### When You Need Help
- [ ] Saved bookmark to NixOS manual (https://nixos.org/manual/nixos/stable/)
- [ ] Joined NixOS Discourse (https://discourse.nixos.org/)
- [ ] Know how to search NixOS Wiki (https://nixos.wiki/)
- [ ] Have access to repository issue tracker

### Troubleshooting Tools
- [ ] Can access system logs (`journalctl`)
- [ ] Can check service status (`systemctl status <service>`)
- [ ] Can list failed services (`systemctl --failed`)
- [ ] Can use trace for debugging (`--show-trace` flag)

## ✨ Final Verification

### System is Considered "Production Ready" When:
- [x] All critical checks above are passing
- [x] System boots reliably from internal drive
- [x] Network and internet access working
- [x] Can rebuild and switch configurations
- [x] User can log in and use desktop environment
- [x] Backup strategy in place
- [x] Know how to rollback if needed

## 📅 Regular Maintenance Schedule

### Weekly
- Check disk space usage
- Review system logs for errors
- Test basic functionality

### Monthly
- Update flake inputs (`nix flake update`)
- Clean old generations (keep last 3-5)
- Run garbage collection
- Review and update configuration as needed

### As Needed
- Add new packages to `environment.systemPackages`
- Adjust service configurations
- Update user settings
- Implement chakra service functionality (future work)

---

## 🎉 Congratulations!

If you've checked off all the critical items above, your iMac 2019 is now running a fully functional NixOS system with the iNixOS-Willowie sacred geometry configuration!

Your system should:
- ✅ Boot natively from internal drives (no USB)
- ✅ Have a responsive desktop environment
- ✅ Be able to update and rebuild declaratively
- ✅ Have proper storage separation (if using Fusion Drive strategy)
- ✅ Be stable and reliable for daily use

**Next Steps:**
1. Customize your desktop environment to your preferences
2. Install additional applications as needed
3. Explore the chakra system architecture
4. Consider implementing the stub services (Atlas, DOJO, etc.)
5. Keep your configuration in sync with GitHub

**Remember:** NixOS is declarative and reproducible. Any changes you make should be in the configuration files, committed to Git, and applied with `nixos-rebuild switch`. This ensures your system remains consistent and recoverable.

Happy computing with your iMac 2019 and iNixOS-Willowie! 🌀
