# Willowie Data — Samba file share for BearsiMac
# Serves /home/jbear/storage as "WillowieData" to macOS clients over the
# LAN and Tailscale (canonical FIELD access path: smb://100.115.159.116).
#
# NixOS 24.05 option syntax: this flake pins nixos-24.05, so the newer
# `services.samba.settings` attrset (24.11+) is NOT available here —
# global config goes through extraConfig, shares through shares.<name>.
#
# No `hosts allow` restriction on purpose: a 192.168.x allowlist would
# silently block Tailscale (100.x) clients, and the Mac Studio reaches
# this box over Tailscale. Access is gated by the NixOS firewall
# (openFirewall) and Samba user auth instead.
#
# After first rebuild, set the Samba credential on the box:
#   sudo smbpasswd -a jbear
{ config, lib, pkgs, ... }:
{
  services.samba = {
    enable = true;
    openFirewall = true;
    securityType = "user";
    extraConfig = ''
      workgroup = WORKGROUP
      server string = Willowie Data Server
      netbios name = BearsiMac

      # macOS client optimisation (Apple SMB extensions)
      vfs objects = catia fruit streams_xattr
      fruit:metadata = stream
      fruit:model = MacSamba
      fruit:posix_rename = yes
      fruit:veto_appledouble = no
      fruit:delete_empty_adfiles = yes
    '';
    shares.WillowieData = {
      path = "/home/jbear/storage";
      writable = "yes";
      "guest ok" = "no";
      comment = "Main Willowie Data Volume";
      "create mask" = "0644";
      "directory mask" = "0755";
    };
  };

  # Ensure the share root exists with jbear ownership
  systemd.tmpfiles.rules = [
    "d /home/jbear/storage 0755 jbear users -"
  ];
}
