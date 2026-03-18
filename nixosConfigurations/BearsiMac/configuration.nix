# BearsiMac - Willowie Kitchen Configuration
# Machine-specific settings for the sacred geometry system
{ config, lib, pkgs, ... }:
{
  imports = [
    ../../../modules/services/copilot-assistant-flake.nix
    ./hardware-configuration.nix
    ../../dot-hive/default.nix
    ../../modules/atlas.nix
  ];

  # Copilot Assistant service configuration
  services.copilot-assistant = {
    enable = true;
    backend = "python";
    backendScript = "/etc/copilot-assistant/copilot-assistant-python.py";
    port = 8765;
  };

  # Basic system configuration
  networking = {
    hostName = "BearsiMac";
    networkmanager.enable = true;
    # Note: Do not enable wireless.enable when using NetworkManager
    # They conflict with each other

    # Firewall configuration
    firewall = {
      enable = true;
      # Allow SSH for remote access
      allowedTCPPorts = [ 22 ];
    };
  };

  # Boot loader configuration for EFI
  boot.loader = {
    systemd-boot.enable = true;
    efi.canTouchEfiVariables = true;
    timeout = 5;
  };

  # iMac 2019 Hardware Support
  hardware = {
    enableRedistributableFirmware = true;
    opengl = {
      enable = true;
      driSupport = true;
    };
  };

  # Enable TRIM for SSD
  services.fstrim.enable = false;

  # Atlas Frontend Configuration for Ghost Alignments
  services.atlasFrontend = {
    enable = false;
    mqttBroker = "mqtt://localhost:1883";
    pulseSyncTopic = "dojo/nodes/pulse/#";
    wsPort = 3000;
    httpPort = 3001;
  };

  # TATA 8i Pulse Engine for Chakra Synchronization
  services.tata8i-pulse-engine = {
    enable = false;
    # Pulse engine specific settings will be auto-configured
  };

  # FIELD-NixOS-SOMA Configuration
  field = {
    enable = true;
    somaIdentity = "⬡ FIELD-NixOS-SOMA — BearsiMac Willowie Kitchen";
    
    trainStation = {
      frequency = 852;
      position = "center";
      symbol = "🚂";
      chakra = "Crown Base";
    };
    
    # Enable Train Station service
    trainStation.serviceEnable = true;
    trainStation.port = 8520;
    
    # Enable Prime Petal generation
    primePetals.enable = true;
    primePetals.generateOnBoot = true;
  };

  # Enable all chakra nodes with their respective alignments
  # The actual chakra configurations are imported via dot-hive/default.nix
  services.dojoNodes = {
    defaults = {
      transactionOptimizationEnabled = true;
    };
    # The nodes themselves are configured in their respective chakra definitions
  };

  # User configuration
  users.users.jbear = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" ];
    shell = pkgs.zsh;

    # SECURITY NOTE: Initial password for first login
    # This password is "nixos" and should be changed immediately after first login!
    #
    # To change password after login:
    #   passwd
    #
    # For production systems, use hashedPassword instead:
    #   1. Generate: mkpasswd -m sha-512
    #   2. Set: hashedPassword = "output-from-mkpasswd";
    #   3. Comment out or remove initialPassword
    initialPassword = "nixos";
  };

  # Enable zsh shell
  programs.zsh.enable = true;

  # System packages
  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    curl
    zsh
    htop
    firefox
    gnome.gnome-tweaks
  ];

  # Enable important services
  services = {
    # SSH Configuration
    # SECURITY NOTE: Password authentication is enabled for initial setup
    # After setting up SSH keys, consider disabling password auth:
    # services.openssh.settings.PasswordAuthentication = false;
    openssh = {
      enable = true;
      settings = {
        # Disable root login for security
        PermitRootLogin = "no";
        # Enable password authentication for initial setup
        # This allows SSH login with the password you set
        PasswordAuthentication = true;
      };
    };
    # Enable X11 and GNOME Desktop
    xserver = {
      enable = true;
      displayManager.gdm.enable = true;
      desktopManager.gnome.enable = true;
      # For iMac's AMD Radeon graphics
      videoDrivers = [ "amdgpu" ];
    };
  };

  # System state version
  system.stateVersion = "23.11";
}
