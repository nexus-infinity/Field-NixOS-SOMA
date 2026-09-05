{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.pulse-home;
  pulseHomeService = pkgs.writeScriptBin "pulse-home" ''
    #!${pkgs.python3}/bin/python3
    ${builtins.readFile ../../services/pulse/home_server.py}
  '';
in {
  options.services.pulse-home = {
    enable = mkEnableOption "read-only PULSE Home contract";

    port = mkOption {
      type = types.port;
      default = 9000;
      description = "Port for the read-only PULSE Home HTTP contract";
    };

    houseId = mkOption {
      type = types.str;
      default = "willowie";
      description = "Stable PULSE house identity";
    };

    trainStationUrl = mkOption {
      type = types.str;
      default = "http://127.0.0.1:8520";
      description = "Existing SOMA Train Station health endpoint";
    };

    monitoringUrl = mkOption {
      type = types.str;
      default = "http://127.0.0.1:9630";
      description = "Existing SOMA Monitoring health endpoint";
    };
  };

  config = mkIf cfg.enable {
    environment.systemPackages = [ pulseHomeService ];

    systemd.services.pulse-home = {
      description = "PULSE Home read-only HTTP contract";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" "train-station.service" ];
      requires = [ "train-station.service" ];

      serviceConfig = {
        Type = "simple";
        ExecStart = "${pulseHomeService}/bin/pulse-home --port ${toString cfg.port} --house-id ${escapeShellArg cfg.houseId} --train-station-url ${escapeShellArg cfg.trainStationUrl} --monitoring-url ${escapeShellArg cfg.monitoringUrl}";
        Restart = "always";
        RestartSec = 5;
        DynamicUser = true;
        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        StandardOutput = "journal";
        StandardError = "journal";
      };
    };

    networking.firewall.allowedTCPPorts = [ cfg.port ];
  };
}
