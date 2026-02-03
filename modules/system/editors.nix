# Text Editor Configuration Module
# Optional text editors for Field-NixOS-SOMA
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.soma.editors;
in
{
  options.soma.editors = {
    enable = mkEnableOption "Text editor packages for SOMA";
    
    kate = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable Kate - KDE Advanced Text Editor.
        A powerful multi-document text editor with syntax highlighting
        for 300+ languages, split view, project support, and plugins.
        
        Best for: Programming, multiple files, GUI preference
      '';
    };
    
    vscode = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable VS Code - Microsoft's feature-rich code editor/IDE.
        Extensive extension ecosystem, integrated terminal, debugging.
        
        Note: Contains telemetry. Use vscodium for open source alternative.
      '';
    };
    
    vscodium = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable VSCodium - Open source VS Code without Microsoft telemetry.
        Same features as VS Code but community-driven and privacy-respecting.
      '';
    };
    
    neovim = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable Neovim - Modern vim-based editor with better defaults.
        More extensible than vim, better plugin support, async execution.
        
        Best for: Terminal power users, SSH editing, efficiency
      '';
    };
    
    emacs = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable Emacs - Extensible, customizable text editor.
        "An operating system disguised as an editor."
        Org-mode, elisp scripting, endless customization.
      '';
    };
    
    nano = mkOption {
      type = types.bool;
      default = true;
      description = ''
        Enable Nano - Simple terminal-based text editor.
        Easy to use, displays keyboard shortcuts at bottom.
        
        Best for: Quick edits, beginners, system administration
      '';
    };
    
    gedit = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable gedit - GNOME's simple text editor.
        Clean interface, integrates well with GNOME desktop.
        
        Best for: GNOME users, simple text editing
      '';
    };
    
    allDevelopment = mkOption {
      type = types.bool;
      default = false;
      description = ''
        Enable all development-oriented editors.
        Installs: kate, vscodium, neovim
      '';
    };
  };
  
  config = mkIf cfg.enable {
    environment.systemPackages = with pkgs;
      # Always included
      [ vim ] ++
      
      # Optional editors based on configuration
      (optional cfg.nano nano) ++
      (optional cfg.kate kate) ++
      (optional cfg.vscode vscode) ++
      (optional cfg.vscodium vscodium) ++
      (optional cfg.neovim neovim) ++
      (optional cfg.emacs emacs) ++
      (optional cfg.gedit gnome.gedit) ++
      
      # Development bundle
      (optionals cfg.allDevelopment [
        kate
        vscodium
        neovim
      ]);
    
    # Helpful shell aliases
    environment.shellAliases = mkMerge [
      {
        vi = "vim";
      }
      (mkIf cfg.neovim {
        vim = "nvim";
        vi = "nvim";
      })
      (mkIf cfg.nano {
        edit = "nano";
      })
      (mkIf cfg.kate {
        kedit = "kate";
      })
    ];
    
    # Set EDITOR environment variable
    environment.variables = {
      EDITOR = mkDefault "vim";
      VISUAL = mkDefault "vim";
    };
    
    # Enable dconf for Kate and GNOME editors to save settings
    programs.dconf.enable = mkDefault true;
  };
}
