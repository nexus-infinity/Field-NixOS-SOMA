# BearsiMac network and Tailscale investigation — 2026-10-20

## Why this note exists

The den machine (`BearsiMac`, previously reachable at `100.115.159.116`) was unreachable from the Mac. Ping and SSH port 22 timed out. This note records what was checked so the investigation can resume without reconstructing the conversation.

## Repository witness

- Repository: `nexus-infinity/Field-NixOS-SOMA`
- Branch: `main`
- Checked commit: `a216efb15b0eaf39d9d98efa8c450f3af6dbf4ce`
- Local `main` matched `origin/main` at the time of inspection.
- Latest tracked commit: `feat(bearsimac): add WillowieData Samba share module` (2026-07-02).
- No later tracked commit was found mentioning rollback, Wi-Fi, wireless, or Tailscale.

## What the tracked configuration says

- `nixosConfigurations/BearsiMac/configuration.nix` enables NetworkManager.
- The same file says not to enable the separate NixOS wireless module when NetworkManager is used.
- Redistributable firmware is enabled.
- SSH is enabled and TCP port 22 is allowed by the tracked firewall configuration.
- No tracked `services.tailscale` or `tailscaled` configuration was found.
- Tailscale appears in comments in `modules/services/samba-willowie.nix` as the intended access path for the Samba share (`100.115.159.116`).

## Claim ceiling

```text
GitHub repository caused a recent rollback: NOT FOUND
Recent tracked Wi-Fi or Tailscale change: NOT FOUND
User manually changed the repository: NOT FOUND
Machine-local NixOS generation change: UNKNOWN
Tailscale identity/state was lost: UNKNOWN
Physical Wi-Fi or power failure: UNKNOWN
Den currently reachable from the Mac: FAIL (at inspection time)
```

The repository does not prove what generation is currently booted on the machine. A rollback remains a possible machine-local explanation, but it is not supported by a recent GitHub change.

## Resume procedure — read only first

Run these at the BearsiMac console before rebuilding, switching generations, restarting services, or regenerating keys:

```bash
readlink -f /run/current-system
sudo nix-env --list-generations --profile /nix/var/nix/profiles/system

systemctl is-enabled NetworkManager tailscaled
systemctl --no-pager --full status NetworkManager tailscaled

nmcli device status
ip link
tailscale status
```

Determine the configured Tailscale state directory before inspecting its state file; do not assume it is `/var/lib/tailscale`.

## Boundaries

This note records repository evidence only. It does not authorize a rebuild, rollback, service restart, Tailscale key regeneration, firewall change, or other machine mutation.
