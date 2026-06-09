{ config, pkgs, lib, ... }:

with lib;

{
  options.services.trident-workspace = {
    enable = mkEnableOption "Trident Scrum development workspace with Copilot CLI";
    
    userName = mkOption {
      type = types.str;
      default = "developer";
      description = "Username for the development workspace";
    };
    
    workspaceDir = mkOption {
      type = types.path;
      default = "/home/developer/workspace";
      description = "Path to workspace directory";
    };
    
    enableCopilot = mkOption {
      type = types.bool;
      default = true;
      description = "Enable GitHub Copilot CLI integration";
    };
    
    pythonVersion = mkOption {
      type = types.str;
      default = "python311";
      description = "Python version to use (python39, python310, python311, etc.)";
    };
  };
  
  config = mkIf config.services.trident-workspace.enable {
    # Create development user
    users.users.${config.services.trident-workspace.userName} = {
      isNormalUser = true;
      description = "Trident Scrum Development User";
      extraGroups = [ "wheel" "networkmanager" "docker" ];
      home = "/home/${config.services.trident-workspace.userName}";
      shell = pkgs.zsh;
    };
    
    # System packages for development
    environment.systemPackages = with pkgs; [
      # Version control
      git
      gh  # GitHub CLI
      
      # Programming languages and tools
      # Fixed: dynamic python selection now uses valid expression form (pkgs.${name})
      # instead of stray ${...} interpolation tokens inside a list. This resolves
      # the "unexpected DOLLAR_CURLY" syntax error while preserving the configurable
      # pythonVersion option (default python311).
      (pkgs.${config.services.trident-workspace.pythonVersion} or pkgs.python311)
      (pkgs.${config.services.trident-workspace.pythonVersion} or pkgs.python311).pkgs.pip
      (pkgs.${config.services.trident-workspace.pythonVersion} or pkgs.python311).pkgs.virtualenv
      nodejs_20
      nodePackages.npm
      nodePackages.typescript
      go
      
      # Development tools
      vim
      neovim
      tmux
      zsh
      oh-my-zsh
      
      # Build tools
      gnumake
      cmake
      gcc
      
      # Container tools
      docker
      docker-compose
      
      # NixOS development
      nixpkgs-fmt
      nix-tree
      nix-diff
      
      # Monitoring and debugging
      htop
      btop
      iotop
      strace
      gdb
      
      # Network tools
      curl
      wget
      netcat
      nmap
      
      # Text processing
      jq
      yq
      ripgrep
      fd
      
      # Terminal multiplexer and shell enhancements
      zellij
      starship
      fzf
      bat
      exa
    ];
    
    # Enable Docker
    virtualisation.docker.enable = true;
    
    # Enable ZSH as default shell
    programs.zsh = {
      enable = true;
      ohMyZsh = {
        enable = true;
        plugins = [ "git" "docker" "python" "node" "npm" ];
        theme = "robbyrussell";
      };
    };
    
    # Enable Git
    programs.git = {
      enable = true;
      config = {
        init.defaultBranch = "main";
        pull.rebase = false;
      };
    };
    
    # GitHub CLI configuration
    programs.gh = {
      enable = true;
    };
    
    # Setup workspace directory
    systemd.tmpfiles.rules = [
      "d ${config.services.trident-workspace.workspaceDir} 0755 ${config.services.trident-workspace.userName} users -"
      "d ${config.services.trident-workspace.workspaceDir}/trident_scrum 0755 ${config.services.trident-workspace.userName} users -"
      "d ${config.services.trident-workspace.workspaceDir}/projects 0755 ${config.services.trident-workspace.userName} users -"
    ];
    
    # Copilot CLI installation service (if enabled)
    systemd.services.copilot-cli-install = mkIf config.services.trident-workspace.enableCopilot {
      description = "Install GitHub Copilot CLI";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];
      
      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = config.services.trident-workspace.userName;
      };
      
      script = ''
        # Install GitHub Copilot CLI via npm if not already installed
        if ! command -v github-copilot-cli &> /dev/null; then
          ${pkgs.nodejs_20}/bin/npm install -g @githubnext/github-copilot-cli
          
          # Setup shell aliases for copilot
          ZSHRC="/home/${config.services.trident-workspace.userName}/.zshrc"
          if [ -f "$ZSHRC" ]; then
            if ! grep -q "github-copilot-cli" "$ZSHRC"; then
              echo "" >> "$ZSHRC"
              echo "# GitHub Copilot CLI aliases" >> "$ZSHRC"
              echo 'eval "$(github-copilot-cli alias -- "$0")"' >> "$ZSHRC"
            fi
          fi
          
          echo "GitHub Copilot CLI installed successfully"
        else
          echo "GitHub Copilot CLI already installed"
        fi
      '';
    };
    
    # Development environment setup service
    systemd.services.trident-workspace-setup = {
      description = "Trident Scrum Workspace Setup";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];
      
      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = config.services.trident-workspace.userName;
      };
      
      script = ''
        WORKSPACE="${config.services.trident-workspace.workspaceDir}"
        
        # Create workspace welcome message
        cat > "$WORKSPACE/README.md" << 'EOF'
        # Trident Scrum Development Workspace
        
        Welcome to your NixOS-based development environment with Trident Scrum framework!
        
        ## Available Tools
        
        - **Python**: ${config.services.trident-workspace.pythonVersion}
        - **Node.js**: 20.x with npm and TypeScript
        - **Go**: Latest stable version
        - **GitHub CLI**: `gh` for GitHub operations
        - **GitHub Copilot CLI**: AI-powered command suggestions (if enabled)
        - **Docker**: Container development
        - **Development Tools**: vim, neovim, tmux, zsh
        
        ## Quick Start
        
        ### Using Trident Scrum Framework
        
        \`\`\`bash
        cd $WORKSPACE/trident_scrum
        python -m pytest tests/  # Run tests
        \`\`\`
        
        ### Using GitHub Copilot CLI
        
        \`\`\`bash
        gh copilot suggest "how to list files"
        gh copilot explain "git rebase -i HEAD~3"
        \`\`\`
        
        Or use the aliases (after reloading shell):
        - `??` - Ask Copilot for command suggestions
        - `git?` - Ask Copilot about git commands
        - `gh?` - Ask Copilot about GitHub CLI
        
        ## Project Structure
        
        - `trident_scrum/` - Trident Scrum framework implementation
        - `projects/` - Your development projects
        
        ## Resources
        
        - [Trident Scrum Documentation](./trident_scrum/README.md)
        - [NixOS Manual](https://nixos.org/manual/nixos/stable/)
        - [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli/)
        
        EOF
        
        echo "Workspace setup completed at $WORKSPACE"
      '';
    };
    
    # Setup Python virtual environment for Trident Scrum
    systemd.services.trident-python-env = {
      description = "Setup Python environment for Trident Scrum";
      after = [ "trident-workspace-setup.service" ];
      wantedBy = [ "multi-user.target" ];
      
      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = config.services.trident-workspace.userName;
      };
      
      script = ''
        WORKSPACE="${config.services.trident-workspace.workspaceDir}/trident_scrum"
        
        if [ ! -d "$WORKSPACE/venv" ]; then
          ${pkgs.${config.services.trident-workspace.pythonVersion}}/bin/python -m venv "$WORKSPACE/venv"
          source "$WORKSPACE/venv/bin/activate"
          
          # Install common Python packages
          pip install --upgrade pip
          pip install pytest pytest-cov black flake8 mypy
          pip install dataclasses-json pyyaml
          
          echo "Python virtual environment created at $WORKSPACE/venv"
        fi
      '';
    };
  };
}
