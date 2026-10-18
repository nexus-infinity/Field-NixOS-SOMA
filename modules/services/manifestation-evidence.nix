# Manifestation Evidence System
# Tracks system state changes AND semantic action outcomes for lineage reconstruction
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.manifestationEvidence;
  
  # Helper to log structured evidence with provenance
  evidenceLogger = pkgs.writeShellScriptBin "log-manifestation-evidence" ''
    #!/usr/bin/env bash
    # Usage: log-manifestation-evidence <event_type> <payload_json>
    # Event types: system_activation, action_issued, action_outcome, observation_recorded, claim_admitted
    
    EVENT_TYPE="$1"
    PAYLOAD="$2"
    TIMESTAMP=$(date -Iseconds)
    
    # Compute content hash for chaining
    PREV_HASH=$(tail -n 1 ${cfg.logFile} 2>/dev/null | jq -r '.content_hash // "genesis"')
    CONTENT_HASH=$(echo -n "$TIMESTAMP$EVENT_TYPE$PAYLOAD$PREV_HASH" | sha256sum | cut -d' ' -f1)
    
    # Structured evidence record
    jq -n \
      --arg ts "$TIMESTAMP" \
      --arg type "$EVENT_TYPE" \
      --argjson payload "$PAYLOAD" \
      --arg prev "$PREV_HASH" \
      --arg hash "$CONTENT_HASH" \
      '{
        timestamp: $ts,
        event_type: $type,
        payload: $payload,
        prev_event_hash: $prev,
        content_hash: $hash
      }' >> ${cfg.logFile}
  '';
in
{
  options.services.manifestationEvidence = {
    enable = mkEnableOption "Manifestation evidence tracking";

    logFile = mkOption {
      type = types.path;
      default = "/var/log/manifestation-evidence.jsonl";
      description = "Structured evidence log (JSONL format with hash chaining)";
    };
    
    enableSemanticOutcomes = mkOption {
      type = types.bool;
      default = true;
      description = "Track semantic action outcomes, not just system generations";
    };
  };

  config = mkIf cfg.enable {
    # Ensure log directory exists with proper permissions
    systemd.tmpfiles.rules = [
      "f ${cfg.logFile} 0644 root root -"
    ];

    # Install evidence logging utility
    environment.systemPackages = [ evidenceLogger pkgs.jq ];

    # Log system activation with generation metadata
    system.activationScripts.manifestationLog = ''
      ${evidenceLogger}/bin/log-manifestation-evidence "system_activation" \
        "$(jq -n --arg gen "$systemConfig" --arg boot "''${NIXOS_CONFIG:-unknown}" \
          '{ system_generation: $gen, boot_config: $boot }')"
    '';
    
    # Create helper scripts for semantic outcome logging
    systemd.services.manifestation-evidence-helper = mkIf cfg.enableSemanticOutcomes {
      description = "Manifestation evidence semantic outcome helper";
      wantedBy = [ "multi-user.target" ];
      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        ExecStart = "${pkgs.coreutils}/bin/true";
      };
    };
  };
}
