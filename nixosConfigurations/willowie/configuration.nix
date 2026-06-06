# Willowie Kitchen - Consciousness-Aware Configuration
{ config, pkgs, ... }:

{
  # System basics
  system.stateVersion = "24.05";
  
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

  # Enable SSH
  services.openssh.enable = true;

  # Firewall configuration (open Ajna port)
  networking.firewall.enable = true;
  networking.firewall.allowedTCPPorts = [ 22 6001 ];
}
