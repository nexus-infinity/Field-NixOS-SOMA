# Text Editors Guide for Field-NixOS-SOMA

## Overview

This guide covers text editors available on NixOS, with a focus on Kate and other popular options for the SOMA configuration.

## Kate - KDE Advanced Text Editor

### What is Kate?

**Kate** (KDE Advanced Text Editor) is a powerful, feature-rich text editor that comes with the KDE desktop environment. It's designed for programmers and advanced users who need more than a basic text editor.

### Key Features

#### 1. **Multi-Document Interface (MDI)**
- Edit multiple files in tabs
- Split view for working on different parts of the same file or different files
- Session management to save and restore your workspace

#### 2. **Syntax Highlighting**
- Support for 300+ programming languages and file formats
- Includes: Python, JavaScript, C/C++, Rust, Go, Nix, Shell scripts, HTML, CSS, Markdown, etc.
- Color-coded syntax makes code easier to read

#### 3. **Code Folding**
- Collapse and expand code blocks
- Makes navigating large files much easier
- Works with functions, classes, loops, conditionals, etc.

#### 4. **Advanced Search & Replace**
- Regular expression support
- Search/replace across multiple files
- Incremental search
- Multi-line search patterns

#### 5. **Auto-Completion**
- Word completion based on document content
- Snippet support for common code patterns
- Configurable auto-complete behavior

#### 6. **Plugins & Extensions**
- Project management plugin
- Terminal emulator integration
- Git integration
- Symbol viewer for code navigation
- File browser sidebar
- Build output panel

#### 7. **Customization**
- Configurable keyboard shortcuts
- Custom color schemes
- Font and display settings
- Toolbar customization
- Editor behavior settings

### Kate vs Other Editors

| Feature | Kate | Vim | Nano | VS Code | Gedit |
|---------|------|-----|------|---------|-------|
| **Learning Curve** | Easy | Steep | Easy | Easy | Easy |
| **GUI** | Yes | No* | No | Yes | Yes |
| **Tabs** | Yes | Yes | No | Yes | Yes |
| **Split View** | Yes | Yes | No | Yes | Yes |
| **Syntax Highlight** | 300+ | Many | Some | Many | Some |
| **Plugins** | Yes | Extensive | No | Extensive | Limited |
| **Resource Usage** | Medium | Light | Light | Heavy | Light |
| **Terminal Use** | No** | Yes | Yes | Yes** | No |
| **Project Support** | Yes | Plugins | No | Yes | No |

*Vim has GUI versions (gvim), **Can run in embedded terminal

### When to Use Kate

**Kate is ideal for:**
- ✅ Programming and software development
- ✅ Editing multiple files simultaneously
- ✅ Working with large code projects
- ✅ Users who prefer GUI over terminal
- ✅ Those coming from Windows/Mac text editors
- ✅ Need syntax highlighting for many languages

**Kate might NOT be the best choice for:**
- ❌ Quick edits in terminal (use nano or vim)
- ❌ Minimal system resource usage (use nano or vim)
- ❌ Remote server editing via SSH (use vim or nano)
- ❌ If you already love and know vim/emacs

## Installing Kate on NixOS

### Method 1: Add to System Packages (Recommended)

Edit your configuration file (e.g., `nixosConfigurations/BearsiMac/configuration.nix`):

```nix
environment.systemPackages = with pkgs; [
  # Existing packages
  git
  vim
  wget
  curl
  
  # Add Kate
  kate
  
  # Optional: KDE frameworks (if you want better integration)
  # kdePackages.kate  # For KDE 6
];
```

Then rebuild your system:
```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

### Method 2: Install for User Only

```bash
nix-env -iA nixos.kate
```

### Method 3: Try Without Installing

```bash
nix-shell -p kate --run kate
```

## Alternative Text Editors on NixOS

### 1. **Vim** (Currently Installed)
- **Type**: Terminal-based, modal editor
- **Best for**: Power users, SSH editing, efficiency
- **Learning curve**: Steep but worth it
- **Package**: `vim` or `neovim`

```nix
environment.systemPackages = with pkgs; [
  vim
  # or
  neovim  # Modern vim alternative
];
```

### 2. **Nano**
- **Type**: Terminal-based, simple
- **Best for**: Quick edits, beginners, simple configs
- **Learning curve**: Very easy
- **Package**: `nano`

```nix
environment.systemPackages = with pkgs; [
  nano
];
```

### 3. **VS Code / VSCodium**
- **Type**: GUI, feature-rich IDE
- **Best for**: Full development environment, extensions
- **Learning curve**: Easy
- **Package**: `vscode` or `vscodium` (open source)

```nix
environment.systemPackages = with pkgs; [
  vscode
  # or
  vscodium  # Telemetry-free version
];
```

### 4. **Gedit** (GNOME Text Editor)
- **Type**: GUI, simple
- **Best for**: GNOME users, simple editing
- **Learning curve**: Very easy
- **Package**: `gnome.gedit` or `gnome-text-editor`

```nix
environment.systemPackages = with pkgs; [
  gnome.gedit
  # or newer version
  gnome-text-editor
];
```

### 5. **Emacs**
- **Type**: Terminal/GUI, extensible
- **Best for**: Power users who want an OS in an editor
- **Learning curve**: Steep
- **Package**: `emacs`

```nix
environment.systemPackages = with pkgs; [
  emacs
];
```

## Recommended Setup for Field-NixOS-SOMA

Given this is a development-focused NixOS configuration, here's a recommended editor setup:

```nix
# In nixosConfigurations/BearsiMac/configuration.nix
environment.systemPackages = with pkgs; [
  # Existing packages
  git
  wget
  curl
  zsh
  htop
  firefox
  gnome.gnome-tweaks
  
  # Text Editors
  vim              # Terminal: quick edits, SSH
  nano             # Terminal: simple edits
  kate             # GUI: main code editor
  # or
  # vscode         # Alternative: full IDE
  # vscodium       # Alternative: open source IDE
  
  # Optional: Enhanced vim
  # neovim
  # neovim-qt      # GUI for neovim
];
```

## Kate Tips & Tricks

### Getting Started with Kate

1. **Open Kate**: Search for "Kate" in your applications menu
2. **Open a file**: File → Open or `Ctrl+O`
3. **Create new file**: File → New or `Ctrl+N`
4. **Save**: File → Save or `Ctrl+S`

### Essential Keyboard Shortcuts

- `Ctrl+N` - New document
- `Ctrl+O` - Open file
- `Ctrl+S` - Save
- `Ctrl+W` - Close document
- `Ctrl+Q` - Quit Kate
- `Ctrl+F` - Find
- `Ctrl+H` - Replace
- `Ctrl+Shift+F` - Find in files
- `F7` - Switch to command line
- `F11` - Full screen
- `Ctrl+Alt+Left/Right` - Switch between tabs

### Useful Features

#### Enable Project Mode
1. View → Tool Views → Projects
2. Click "Open Project" button
3. Select your project directory

#### Split View
- View → New View
- Or click the split view button in the toolbar
- Great for comparing files or editing different parts of the same file

#### Configure Syntax Highlighting
1. Settings → Configure Kate
2. Editor Component → Highlighting
3. Select your preferred color scheme

#### Show Line Numbers
1. View → Show Line Numbers
2. Or Settings → Configure Kate → Editor Component → Appearance

#### Terminal in Kate
1. View → Tool Views → Terminal
2. A terminal panel appears at the bottom
3. Run commands without leaving the editor

## Configuration Examples

### Full Editor Setup

```nix
# nixosConfigurations/BearsiMac/configuration.nix
{ config, lib, pkgs, ... }:
{
  # ... existing config ...
  
  # System packages with multiple editor options
  environment.systemPackages = with pkgs; [
    # Core utilities
    git vim wget curl zsh htop
    
    # GUI Applications
    firefox
    gnome.gnome-tweaks
    
    # Text Editors - Choose what you need
    kate              # KDE's powerful editor
    nano              # Simple terminal editor
    # vscode          # Microsoft's IDE (uncomment if needed)
    # vscodium        # Open source VS Code (uncomment if needed)
    
    # Development tools
    python3
    nodejs
    
    # Optional: KDE integration for Kate
    # kdePackages.kate
  ];
  
  # Set default editor (optional)
  environment.variables.EDITOR = "vim";  # or "kate" for GUI
  
  # For Kate configuration persistence
  programs.dconf.enable = true;
}
```

## Troubleshooting

### Kate Won't Start
```bash
# Check if Kate is installed
which kate

# If not found, install it
nix-env -iA nixos.kate

# Try running from terminal to see errors
kate
```

### Missing Syntax Highlighting
Kate should come with syntax definitions. If missing:
```bash
# Reinstall Kate
nix-env -e kate
nix-env -iA nixos.kate
```

### Kate Looks Different from KDE
Kate on GNOME won't have full KDE integration, but it works fine. For better integration, you could:
1. Install `breeze-gtk` theme: `environment.systemPackages = [ pkgs.libsForQt5.breeze-gtk ];`
2. Or accept that it will use GTK/GNOME styling

## Conclusion

**Kate is an excellent middle-ground editor** that provides:
- ✅ Powerful features without the complexity of full IDEs
- ✅ GUI convenience without heavy resource usage
- ✅ Great for code editing across many languages
- ✅ Works well on any desktop environment (KDE, GNOME, etc.)

For the **Field-NixOS-SOMA** project:
- Use **vim** for quick terminal edits and SSH work
- Use **Kate** for main development work with multiple files
- Consider **VS Code/VSCodium** if you need full IDE features

## Further Resources

- **Kate Homepage**: https://kate-editor.org/
- **Kate Documentation**: https://docs.kde.org/stable5/en/kate/kate/
- **NixOS Wiki - Text Editors**: https://nixos.wiki/wiki/Text_editors
- **KDE Community**: https://community.kde.org/

---

**Last Updated**: 2026-02-03  
**For**: Field-NixOS-SOMA Project
