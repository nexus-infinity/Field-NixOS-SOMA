
###############################################################################
# BearsiMac Configuration (proper module)
#
# Replaces the previous copilot fragment / duplicate blocks.
# Provides clean imports matching the modules list from flake.nix
# (for BearsiMac) + dot-hive + the copilot service.
# Relative paths are used to keep flake pure eval happy (no absolute
# /nix/store paths leaking in).
###############################################################################

{ config, pkgs, lib, specialArgs ? {}, ... }:

{
  imports = [
    # Hardware from the BearsiMac subdir (as referenced in flake)
    ./BearsiMac/hardware-configuration.nix

    # SOMA / FIELD core modules (from the BearsiMac entry in flake.nix)
    ../modules/services/dojo-nodes.nix
    ../dot-hive/default.nix
    ../modules/services/atlas-frontend.nix

    # SOMA octahedron modules
    ../modules/field-integration.nix
    ../modules/prime-petals.nix
    ../modules/train-station.nix

    # Machine-specific config from subdir
    ./BearsiMac/configuration.nix

    # Copilot assistant flake (clean relative import to address purity error)
    ../modules/services/copilot-assistant-flake.nix
  ];

  # Copilot Assistant Service (preserved from the original fragment)
  services.copilot-assistant = {
    enable = true;
    backend = "python";
    backendScript = "/etc/copilot-assistant/copilot-assistant-python.py";
    port = 8765;
  };
}
