{
  description = "BearsiMac - Willowie Kitchen NixOS Configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  };

  outputs = { self, nixpkgs }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    nixosConfigurations = {
      # Original BearsiMac configuration
      BearsiMac = nixpkgs.lib.nixosSystem {
        inherit system;

        specialArgs = {
          inherit self nixpkgs;
          sacredGeometryPath = ./sacred_geometry;
          chakrasPath = ./chakras;
        };

        modules = [
          ./nixosConfigurations/BearsiMac/hardware-configuration.nix
          # DOJO nodes module - defines services.dojoNodes options
          ./modules/services/dojo-nodes.nix

          # Aggregator chakra module that uses sacredGeometryPath + chakrasPath
          ./dot-hive/default.nix
          ./modules/services/atlas-frontend.nix 

          # SOMA octahedron modules
          ./modules/field-integration.nix
          ./modules/prime-petals.nix
          ./modules/train-station.nix

          # Machine-specific config
          ./nixosConfigurations/BearsiMac/configuration.nix

          # Extra Nix settings module (inline)
          ({ pkgs, ... }: {
            nix.settings = {
              auto-optimise-store = true;
              experimental-features = [ "nix-command" "flakes" ];
            };
          })
        ];
      };

      # New Willowie configuration with consciousness system
      willowie = nixpkgs.lib.nixosSystem {
        inherit system;

        specialArgs = {
          inherit self nixpkgs;
          sacredGeometryPath = ./sacred_geometry;
          chakrasPath = ./chakras;
        };

        modules = [
          ./hardware-configuration.nix

          # Consciousness services
          ./modules/services/ajna-agent.nix
          ./modules/services/vishuddha-desktop.nix
          ./modules/services/sound-field.nix
          ./modules/services/model-purity.nix
          ./modules/services/manifestation-evidence.nix

          # Aggregator chakra module
          ./dot-hive/default.nix
          ./modules/services/atlas-frontend.nix

          # SOMA octahedron modules
          ./modules/field-integration.nix
          ./modules/prime-petals.nix
          ./modules/train-station.nix

          # Willowie-specific configuration
          ./nixosConfigurations/willowie/configuration.nix

          # Extra Nix settings module
          ({ pkgs, ... }: {
            nix.settings = {
              auto-optimise-store = true;
              experimental-features = [ "nix-command" "flakes" ];
            };
          })
        ];
      };
      
      # Trident Scrum development workspace configuration
      trident-dev = nixpkgs.lib.nixosSystem {
        inherit system;

        specialArgs = {
          inherit self nixpkgs;
          sacredGeometryPath = ./sacred_geometry;
          chakrasPath = ./chakras;
        };

        modules = [
          ./hardware-configuration.nix

          # Trident workspace service
          ./modules/services/trident-workspace.nix

          # Basic system configuration
          ({ pkgs, ... }: {
            # Enable Trident workspace
            services.trident-workspace = {
              enable = true;
              userName = "developer";
              workspaceDir = "/home/developer/workspace";
              enableCopilot = true;
              pythonVersion = "python311";
            };
            
            # System basics
            boot.loader.systemd-boot.enable = true;
            boot.loader.efi.canTouchEfiVariables = true;
            
            networking.networkmanager.enable = true;
            time.timeZone = "America/New_York";
            
            system.stateVersion = "23.11";
            
            nix.settings = {
              auto-optimise-store = true;
              experimental-features = [ "nix-command" "flakes" ];
            };
          })
        ];
      };
      
      # SOMA-Willowie Ubuntu Collective Consciousness
      soma-willowie = nixpkgs.lib.nixosSystem {
        inherit system;
        
        specialArgs = {
          inherit self nixpkgs;
          sacredGeometryPath = ./sacred_geometry;
          chakrasPath = ./chakras;
        };
        
        modules = [
          ./hardware-configuration.nix
          
          # Infrastructure Services (Agent 1, 2, 3)
          ./modules/infrastructure/eventbus.nix
          ./modules/infrastructure/proofstore.nix
          ./modules/infrastructure/scheduler.nix
          
          # 9 Chakra Modules (Ubuntu DNA agents)
          ./chakras/muladhara/module.nix
          ./chakras/svadhisthana/module.nix
          ./chakras/manipura/module.nix
          ./chakras/anahata/module.nix
          ./chakras/vishuddha/module.nix
          ./chakras/ajna/module.nix
          ./chakras/sahasrara/module.nix
          ./chakras/soma/module.nix
          ./chakras/jnana/module.nix  # Agent 99 Meta-Coordinator
          
          # MCP Bridge
          ./modules/services/soma-mcp-bridge.nix
          
          # Existing FIELD modules
          ./modules/field-integration.nix
          ./modules/prime-petals.nix
          ./modules/train-station.nix
          
          # Configuration
          ({ pkgs, ... }: {
            # Enable all 9 chakra services
            services.soma = {
              muladhara.enable = true;
              svadhisthana.enable = true;
              manipura.enable = true;
              anahata.enable = true;
              vishuddha.enable = true;
              ajna.enable = true;
              sahasrara.enable = true;
              soma.enable = true;
              jnana.enable = true;  # Agent 99
            };
            
            # Enable infrastructure services
            services.soma-infrastructure = {
              eventbus.enable = true;
              proofstore.enable = true;
              scheduler.enable = true;
            };
            
            # Enable MCP bridge
            services.soma-mcp-bridge.enable = true;
            
            # System basics
            boot.loader.systemd-boot.enable = true;
            boot.loader.efi.canTouchEfiVariables = true;
            
            networking.networkmanager.enable = true;
            time.timeZone = "America/New_York";
            
            system.stateVersion = "23.11";
            
            nix.settings = {
              auto-optimise-store = true;
              experimental-features = [ "nix-command" "flakes" ];
            };
          })
        ];
      };
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        buildInputs = [ pkgs.git pkgs.nix ];
        shellHook = ''
          echo "Dev shell active. Useful commands:
            - nix flake show
            - nixos-rebuild build --flake .#willowie
            - nix build .#nixosConfigurations.willowie.config.system.build.toplevel
          "
        '';
      };
      
      # SOMA Ubuntu development shell
      soma = pkgs.mkShell {
        buildInputs = with pkgs; [
          git
          python311Full
          python311Packages.pip
          python311Packages.fastapi
          python311Packages.uvicorn
          python311Packages.pydantic
          python311Packages.redis
          python311Packages.psycopg2
          redis
          postgresql_15
        ];
        
        shellHook = ''
          echo "🌍 SOMA Ubuntu Development Environment"
          echo "========================================="
          echo ""
          echo "Ubuntu Philosophy: I am because we are"
          echo ""
          echo "Available commands:"
          echo "  - ./scripts/validate_all_dna.sh - Validate DNA blueprints"
          echo "  - ./scripts/test_soma_coherence.sh - Test chakra health"
          echo "  - python3 services/agent_99_meta_coordinator.py - Run Agent 99"
          echo "  - python3 services/mcp/soma_mcp_bridge.py - Run MCP bridge"
          echo ""
          echo "Build SOMA configuration:"
          echo "  nix build .#nixosConfigurations.soma-willowie.config.system.build.toplevel"
          echo ""
        '';
      };
      
      # Trident Scrum development shell
      trident = pkgs.mkShell {
        buildInputs = with pkgs; [
          git
          python311Full
          python311Packages.pip
          python311Packages.virtualenv
          python311Packages.pytest
          python311Packages.pytest-cov
          nodejs_20
          nodePackages.npm
          nodePackages.typescript
          gh
        ];
        
        shellHook = ''
          echo "🔱 Trident Scrum Development Environment"
          echo "========================================="
          echo ""
          echo "Available tools:"
          echo "  - Python 3.11 with pytest"
          echo "  - Node.js 20 with npm"
          echo "  - GitHub CLI (gh)"
          echo ""
          echo "Quick start:"
          echo "  cd trident_scrum"
          echo "  python3 tests/test_sprint_trident.py"
          echo "  python3 examples/complete_demo.py"
          echo ""
          echo "To install Copilot CLI:"
          echo "  npm install -g @githubnext/github-copilot-cli"
          echo ""
        '';
      };
    };

    # nixpkgs-fmt formatter support (optional if available)
    formatter = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (system:
      nixpkgs.legacyPackages.${system}.nixpkgs-fmt
    );
  };
}
