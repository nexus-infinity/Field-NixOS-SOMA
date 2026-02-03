# Example: Adding Kate Editor to Your Configuration

## Simple Method - Direct Package Addition

The easiest way to add Kate to your NixOS system is to add it directly to your system packages.

### Step 1: Edit Your Configuration

Open `nixosConfigurations/BearsiMac/configuration.nix` and locate the `environment.systemPackages` section.

**Before:**
```nix
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
```

**After:**
```nix
environment.systemPackages = with pkgs; [
  git
  vim
  wget
  curl
  zsh
  htop
  firefox
  gnome.gnome-tweaks
  
  # Text Editors
  kate              # KDE Advanced Text Editor
  nano              # Simple terminal editor
];
```

### Step 2: Rebuild Your System

```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

### Step 3: Launch Kate

```bash
kate
```

## Summary

Kate strikes a perfect balance between simplicity and power for development work!
