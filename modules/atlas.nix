{ config, pkgs, lib, ... }:

with lib;

let
  atlasExec = "/run/current-system/sw/bin/atlas-bridge";
in
{
  environment.systemPackages = with pkgs; [
    ibus
    htop
    podman
  ];

  services.prometheus.exporters.node.enable = true;

  services.mosquitto = {
    enable = true;
    package = pkgs.mosquitto;
    listeners = [
      {
        address = "127.0.0.1";
        port = 1883;
        omitPasswordAuth = true;
        settings.allow_anonymous = true;
      }
    ];
  };

  users.groups.atlas = { };

  users.users.atlas = {
    isSystemUser = true;
    group = "atlas";
    description = "Atlas runtime user";
    createHome = false;
    home = "/var/lib/atlas";
    extraGroups = [ ];
    shell = "/sbin/nologin";
  };

  systemd.services."atlas-frontend" = {
    description = "Atlas frontend (bridge)";
    wantedBy = [ "multi-user.target" ];
    after = [ "network.target" "mosquitto.service" ];
    serviceConfig = {
      ExecStart = "${atlasExec} --config /etc/atlas/config.yaml";
      User = "atlas";
      Group = "atlas";
      Restart = "always";
      RestartSec = "5s";
      MemoryMax = "600M";
      CPUQuota = "50%";
      WorkingDirectory = "/var/lib/atlas";
    };
    preStart = ''
      mkdir -p /var/lib/atlas /var/log/atlas /etc/atlas
      chown -R atlas:atlas /var/lib/atlas /var/log/atlas /etc/atlas
    '';
  };

  system.activationScripts.bootPermissions.text = ''
    # Harden /boot and the random-seed file
    chmod 0755 /boot || true
    chmod 0600 /boot/loader/random-seed || true
  '';
}
