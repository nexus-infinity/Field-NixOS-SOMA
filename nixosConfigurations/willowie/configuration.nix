# Willowie Kitchen - Consciousness-Aware Configuration
{ config, pkgs, ... }:

{
  # System basics
  system.stateVersion = "23.11";
  
  # Networking
  networking.hostName = "willowie";
  networking.networkmanager.enable = true;

  # Enable consciousness services
  services.ajnaAgent.enable = true;
  services.vishuddhDesktop.enable = true;
  services.soundField.enable = true;
  services.modelPurity.enable = true;
  services.manifestationEvidence.enable = true;

  # User configuration
  users.users.willowie = {
    isNormalUser = true;
    description = "Willowie User";
    extraGroups = [ "wheel" "networkmanager" "audio" "video" ];
    initialPassword = "change-me";
  };

  # System packages
  environment.systemPackages = with pkgs; [
    vim
    git
    curl
    jq
    python3
    htop
  ];

  # Enable SSH with password authentication (for first-boot access)
  services.openssh = {
    enable = true;
    openFirewall = true;
    settings = {
      PermitRootLogin = "prohibit-password";
      PasswordAuthentication = true;
      KbdInteractiveAuthentication = true;
    };
  };

  # Firewall configuration (open Ajna port)
  networking.firewall.enable = true;
  networking.firewall.allowedTCPPorts = [ 22 6001 ];
}
