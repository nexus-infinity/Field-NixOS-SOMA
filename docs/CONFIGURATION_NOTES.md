# BearsiMac Configuration Notes

Repository: nexus-infinity/iNixOS-Willowie
Branch: atlas-integration
Flake entry: nixosConfigurations.BearsiMac
Commit reference used for this note: 64f67af43da00a6e7d32b0e9daffe3dd42592cdb
Generated: 2025-11-12T03:01:00Z

These notes record geometric, semantic, and temporal identification for the BearsiMac NixOS configuration. They are intended to be human-readable documentation and a single source of truth for system-level references. Update on each meaningful change and include the new commit SHA in the header.

---

## 1. Geometric Identification (Spatial & Structural)

- Metatron Cube Translator (central bridge): sacred_geometry/metatron_cube_translator.nix
  - Role: Aggregates and translates geometry-inspired configuration logic used by chakra modules.
  - System mapping: used by dot-hive and chakra aggregator modules.

- DOJO Hexagonal Hive (chakra aggregator): dot-hive/default.nix
  - Contains the set of 9 chakra modules (petals) that make up the node mesh.
  - Chakra modules are located in `chakras/` with names:
    - ajna, anahata, jnana, manipura, muladhara, sahasrara, soma, svadhisthana, vishuddha

- Atlas Frontend (ghost alignment UI): modules/services/atlas-frontend.nix
  - Exposed options: `services.atlasFrontend.enable`, `mqttBroker`, `pulseSyncTopic`, `wsPort`, `httpPort`
  - Status in current config: disabled (intentional temporary disable to allow system build)

- TATA 8i Pulse Engine: modules/services/tata8i-pulse-engine.nix
  - Role: Pulse coordination for chakra synchronization. Service implementation pending.

- Mapping visualization (conceptual):
  - Central hub (Metatron) -> Aggregator (dot-hive) -> Chakra petals (chakras/*) -> DOJO nodes -> System services

## 2. Semantic Identification (Names & Meanings)

- Top-level flake outputs: `nixosConfigurations.BearsiMac` 
  - Uses `modules = [ ./nixosConfigurations/BearsiMac/hardware-configuration.nix, ./modules/services/*, ./dot-hive/default.nix, ./nixosConfigurations/BearsiMac/configuration.nix ]`

- Important options and their meaning:
  - `networking.networkmanager.enable` : controls NetworkManager; set true for GUI-managed networks.
  - `boot.loader.systemd-boot.enable` : installs systemd-boot into the EFI partition; requires /boot mounted as vfat.
  - `users.users.<user>.shell` : set to `pkgs.zsh` when `programs.zsh.enable = true` for path and environment consistency; otherwise set `ignoreShellProgramCheck = true`.
  - `services.fstrim.enable` : periodic TRIM for SSDs.
  - `environment.systemPackages` : stable list of packages installed system-wide.
  - `services.openssh.enable` : controls `sshd` service for remote access.
  - `xserver.desktopManager.gnome.enable` & `xserver.displayManager.gdm.enable` : enable GNOME desktop and GDM.

- Module conventions:
  - Service modules are in `modules/services/` and should expose `options.services.<name>` and `config` that uses `mkIf config.services.<name>.enable` to declare `systemd.services` entries.
  - Chakra modules must declare their node identifiers and any MQTT topics or ports they require.

## 3. Temporal Identification (Timestamps & Versioning)

- Generated timestamp: 2025-11-12T03:01:00Z
- NixOS system.stateVersion: 23.11 (declared in configuration.nix)
- Flake commit reference: 64f67af43da00a6e7d32b0e9daffe3dd42592cdb (replace with HEAD for future changes)
- Change log (high level):
  - 2025-11-12: Created CONFIGURATION_NOTES.md; restored critical services and added hardware-configuration.nix import.

- Recommendation: update the header with new commit SHA and ISO8601 timestamp for every PR that changes system topology or service enablement. This makes rebuilds traceable to note revisions.

## 4. Operational & Recovery Notes

- Installer vs Installed System: the live USB environment uses different /etc/nixos/configuration.nix (installer file). Always run `nixos-install --flake .#BearsiMac --root /mnt` when performing fresh installs from the live USB.

- Mountpoints (as used during install):
  - /dev/sda1 -> /mnt/boot (vfat)
  - /dev/sda2 -> /mnt (ext4)

- Password recovery (chroot method):
  - Boot live USB -> mount /dev/sda2 to /mnt and /dev/sda1 to /mnt/boot -> bind /dev /proc /sys /run -> `sudo chroot /mnt /bin/sh -c "passwd root && passwd jbear"`

- SSH troubleshooting checklist: ensure `services.openssh.enable = true`, `services.openssh.openFirewall = true`, and `services.openssh.settings.PasswordAuthentication = true` (root logins remain `PermitRootLogin = "prohibit-password"`). After updating config, run `sudo systemctl restart sshd` on the installed system. Use `ssh -vvv` from a client for debug.

## 5. Semantic Labels & Tags (for search & automation)

- tags: ["nixos","bearsimac","willowie","sacred-geometry","chakras","atlas-frontend","systemd-boot","gnome","ssh"]
- ui-labels: `atlas:disabled`, `gnome:enabled`, `ssh:enabled`, `boot:systemd-boot`

## 6. How to update these notes (PR workflow)

1. Edit `docs/CONFIGURATION_NOTES.md` on branch `atlas-integration` or in a feature branch.
2. Update the header commit SHA and timestamp.
3. Push and open a PR targeting `atlas-integration` with the reasons for the change.
4. After merging, pull to local machine: `git pull origin atlas-integration`.

---

If you want, I can also create a machine-readable JSON file alongside this markdown (docs/CONFIGURATION_NOTES.json) containing the same geometric/semantic/temporal fields for automation. Say the word and I will add it to the branch `atlas-integration`.
