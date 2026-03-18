# FIELD Blueprint - Single Source of Truth for iMac 2019 NixOS Configuration
# This module serves as the authoritative definition for core system settings
{ config, lib, pkgs, ... }:

{
  # ============================================================================
  # System Identity
  # ============================================================================
  
  networking.hostName = "iMac2019";
  
  # ============================================================================
  # Boot Configuration (Single Ownership)
  # ============================================================================
  # This is the ONLY place where boot loader options should be defined
  # Do NOT duplicate these in configuration.nix or hardware-configuration.nix
  
  boot.loader = {
    systemd-boot = {
      enable = true;
      # Limit number of generations to keep in boot menu
      configurationLimit = 10;
    };
    efi = {
      canTouchEfiVariables = true;
      # ESP mount point
      efiSysMountPoint = "/boot";
    };
    # Boot timeout (seconds)
    timeout = 5;
  };
  
  # ============================================================================
  # Filesystem Declarations (Single Ownership)
  # ============================================================================
  # These are the authoritative mount definitions for / and /boot
  # Do NOT duplicate in hardware-configuration.nix
  # hardware-configuration.nix should only contain auto-detected supplementary mounts
  
  # TODO: Replace UUIDs below with actual values from your system
  # Find UUIDs with: sudo blkid
  # Or from hardware-configuration.nix after initial generation
  
  fileSystems."/" = {
    device = "/dev/disk/by-uuid/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";  # TODO: Replace with actual root UUID
    fsType = "btrfs";
    options = [ "subvol=@" "compress=zstd" "noatime" ];
  };
  
  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/XXXX-XXXX";  # TODO: Replace with actual ESP UUID (FAT32, shorter format)
    fsType = "vfat";
    options = [ "fmask=0022" "dmask=0022" ];
  };
  
  # ============================================================================
  # Swap Configuration
  # ============================================================================
  
  # swapDevices = [
  #   {
  #     device = "/dev/disk/by-uuid/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";  # TODO: Replace if using swap
  #   }
  # ];
  
  # Or for swapfile on Btrfs:
  # swapDevices = [ ];
  # Note: Btrfs swapfiles require specific setup, see NixOS manual
  
  # ============================================================================
  # Desktop Environment
  # ============================================================================
  
  services.xserver = {
    enable = true;
    
    # Display manager
    displayManager.gdm.enable = true;
    
    # Desktop environment (choose one)
    desktopManager.gnome.enable = true;
    # desktopManager.plasma5.enable = true;  # Alternative: KDE Plasma
    
    # Keyboard layout
    xkb = {
      layout = "us";
      # variant = "";
    };
  };
  
  # ============================================================================
  # Audio
  # ============================================================================
  
  # PipeWire (modern audio server)
  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
    # jack.enable = true;  # Uncomment for JACK support
  };
  
  # Disable PulseAudio if using PipeWire
  hardware.pulseaudio.enable = false;
  
  # ============================================================================
  # Hardware Support
  # ============================================================================
  
  # Enable OpenGL
  hardware.opengl = {
    enable = true;
    driSupport = true;
    driSupport32Bit = true;
  };
  
  # Bluetooth
  hardware.bluetooth = {
    enable = true;
    powerOnBoot = true;
  };
  services.blueman.enable = true;  # Bluetooth manager GUI
  
  # ============================================================================
  # Networking
  # ============================================================================
  
  networking = {
    networkmanager.enable = true;
    
    # Firewall configuration
    firewall = {
      enable = true;
      # allowedTCPPorts = [ 22 ];
      # allowedUDPPorts = [ ];
    };
  };
  
  # ============================================================================
  # User Configuration
  # ============================================================================
  
  users.users.jbear = {  # TODO: Replace with your username
    isNormalUser = true;
    description = "Primary User";  # TODO: Replace with your name
    extraGroups = [ 
      "wheel"          # sudo access
      "networkmanager" # network management
      "video"          # video devices
      "audio"          # audio devices
    ];
    shell = pkgs.bash;  # or pkgs.zsh, pkgs.fish, etc.
    # hashedPassword = "...";  # Set with: mkpasswd -m sha-512
  };
  
  # Enable sudo without password for wheel group (optional, remove if undesired)
  # security.sudo.wheelNeedsPassword = false;
  
  # ============================================================================
  # System Packages
  # ============================================================================
  
  environment.systemPackages = with pkgs; [
    # Essential tools
    vim
    git
    wget
    curl
    htop
    
    # System utilities
    file
    tree
    lsof
    pciutils
    usbutils
    
    # Network tools
    inetutils
    dnsutils
    
    # Archive tools
    zip
    unzip
    p7zip
    
    # Development
    gcc
    gnumake
    
    # Add additional packages as needed
  ];
  
  # ============================================================================
  # Services
  # ============================================================================
  
  services.openssh = {
    enable = true;
    openFirewall = true;
    settings = {
      PermitRootLogin = "prohibit-password";
      PasswordAuthentication = true;
      KbdInteractiveAuthentication = true;
    };
  };
  
  # Printing support
  services.printing.enable = true;
  
  # Automatic system updates (optional)
  # system.autoUpgrade = {
  #   enable = true;
  #   allowReboot = false;
  # };
  
  # ============================================================================
  # Security
  # ============================================================================
  
  # Automatic garbage collection
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 30d";
  };
  
  # Optimize nix store
  nix.settings = {
    auto-optimise-store = true;
    # Enable flakes if using flake-based config
    experimental-features = [ "nix-command" "flakes" ];
  };
  
  # ============================================================================
  # Locale and Time
  # ============================================================================
  
  time.timeZone = "America/New_York";  # TODO: Set your timezone
  
  i18n.defaultLocale = "en_US.UTF-8";
  
  i18n.extraLocaleSettings = {
    LC_ADDRESS = "en_US.UTF-8";
    LC_IDENTIFICATION = "en_US.UTF-8";
    LC_MEASUREMENT = "en_US.UTF-8";
    LC_MONETARY = "en_US.UTF-8";
    LC_NAME = "en_US.UTF-8";
    LC_NUMERIC = "en_US.UTF-8";
    LC_PAPER = "en_US.UTF-8";
    LC_TELEPHONE = "en_US.UTF-8";
    LC_TIME = "en_US.UTF-8";
  };
  
  # ============================================================================
  # State Version
  # ============================================================================
  # This value determines the NixOS release with which your system is to be
  # compatible. Do NOT change this after installation unless you know what you're doing.
  
  system.stateVersion = "23.11";  # TODO: Match your NixOS version
  
  # ============================================================================
  # Notes
  # ============================================================================
  # 
  # This blueprint follows the "single ownership" principle:
  # - Boot loader configuration is defined ONLY here
  # - Root (/) and /boot filesystems are defined ONLY here
  # - hardware-configuration.nix should contain auto-detected hardware settings
  # - configuration.nix should import both this blueprint and hardware-configuration.nix
  #
  # After editing this file:
  # 1. Ensure UUIDs are correct (use `sudo blkid`)
  # 2. Validate syntax: nix-instantiate --parse blueprint.nix
  # 3. Run preflight: sudo field-preflight.sh
  # 4. Apply changes: sudo field-weave.sh
  #
}
