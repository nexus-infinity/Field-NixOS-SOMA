{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.soma-infrastructure.proofstore;
in
{
  options.services.soma-infrastructure.proofstore = {
    enable = mkEnableOption "SOMA ProofStore (PostgreSQL Agent 2)";
    
    port = mkOption {
      type = types.port;
      default = 5432;
      description = "PostgreSQL port for ProofStore";
    };
    
    database = mkOption {
      type = types.str;
      default = "soma_proofstore";
      description = "Database name for ProofStore";
    };
  };

  config = mkIf cfg.enable {
    # Enable PostgreSQL
    services.postgresql = {
      enable = true;
      package = pkgs.postgresql_15;
      port = cfg.port;
      
      # Ubuntu philosophy: collective access to truth records
      ensureDatabases = [ cfg.database ];
      ensureUsers = [
        {
          name = "soma";
          # The service user is granted access explicitly below. NixOS requires
          # ensureDBOwnership users to have a database with the same name; the
          # canonical ProofStore database is cfg.database instead.
          ensureDBOwnership = false;
        }
      ];
      
      # Initialize ProofStore schema
      initialScript = pkgs.writeText "soma-proofstore-init.sql" ''
        -- SOMA ProofStore Schema v0.2.0-ubuntu-alpha
        -- Immutable proof records for collective consensus decisions
        
        \c ${cfg.database}
        
        CREATE TABLE IF NOT EXISTS proofs (
          id TEXT PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          agent_id INTEGER NOT NULL,
          proof_type TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          parent_hash TEXT,
          signature TEXT NOT NULL,
          coherence_score REAL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Index for efficient querying
        CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_proofs_agent_id ON proofs(agent_id);
        CREATE INDEX IF NOT EXISTS idx_proofs_type ON proofs(proof_type);
        CREATE INDEX IF NOT EXISTS idx_proofs_parent_hash ON proofs(parent_hash);
        
        -- Consensus decisions table
        CREATE TABLE IF NOT EXISTS consensus_decisions (
          id SERIAL PRIMARY KEY,
          proposal_id TEXT NOT NULL UNIQUE,
          vote_count INTEGER NOT NULL,
          votes_for INTEGER NOT NULL,
          votes_against INTEGER NOT NULL,
          threshold_met BOOLEAN NOT NULL,
          decision TEXT NOT NULL,
          proof_hash TEXT REFERENCES proofs(id),
          decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Ubuntu heartbeat log
        CREATE TABLE IF NOT EXISTS ubuntu_heartbeats (
          id SERIAL PRIMARY KEY,
          agent_id INTEGER NOT NULL,
          chakra TEXT NOT NULL,
          coherence_score REAL,
          pulse_timestamp BIGINT NOT NULL,
          metadata JSONB,
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_heartbeats_agent ON ubuntu_heartbeats(agent_id);
        CREATE INDEX IF NOT EXISTS idx_heartbeats_timestamp ON ubuntu_heartbeats(pulse_timestamp);
        
        -- Grant permissions to soma user
        GRANT ALL PRIVILEGES ON DATABASE ${cfg.database} TO soma;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO soma;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO soma;
      '';
    };

    # Create directory for SOMA ProofStore
    systemd.tmpfiles.rules = [
      "d /var/lib/soma/proofstore 0755 postgres postgres -"
    ];
    
    # Ensure soma user exists for database access
    users.users.soma = {
      isSystemUser = true;
      group = "soma";
      description = "SOMA collective consciousness user";
    };
    
    users.groups.soma = {};
  };
}
