# Quick Start: Adding Text Editors

## TL;DR - Add Kate Editor

Want Kate (KDE's text editor) on your NixOS system? Here's the fastest way:

### Option 1: Quick Command (Temporary)
```bash
nix-shell -p kate --run kate
```

### Option 2: Install for User
```bash
nix-env -iA nixos.kate
```

### Option 3: System-Wide (Recommended)

Edit `nixosConfigurations/BearsiMac/configuration.nix`:

```nix
environment.systemPackages = with pkgs; [
  git
  vim
  # ... other packages ...
  
  kate  # Add this line
];
```

Then rebuild:
```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

## Using the Editors Module (Advanced)

### Step 1: Import the Module

In your configuration file:
```nix
imports = [
  ../../modules/system/editors.nix  # Add this
  # ... other imports ...
];
```

### Step 2: Enable Editors

```nix
# Enable the editors module and choose what you want
soma.editors = {
  enable = true;
  kate = true;      # Kate editor
  nano = true;      # Simple terminal editor (enabled by default)
  # vscodium = true;  # Uncomment for VS Code (open source)
  # neovim = true;    # Uncomment for modern vim
};
```

### Step 3: Rebuild System

```bash
sudo nixos-rebuild switch --flake .#BearsiMac
```

## What is Kate?

Kate is **KDE's Advanced Text Editor** - think of it as a middle ground between simple text editors (like Notepad) and full IDEs (like VS Code).

### Key Features
- 📝 **300+ languages** with syntax highlighting
- 🪟 **Split view** - edit multiple files side-by-side
- 🔍 **Advanced search** - regex, multi-file search
- 🎨 **Themes** - customize colors and appearance
- 🔌 **Plugins** - terminal, git, project management
- 📁 **Project mode** - work with entire directories
- 💻 **Code folding** - collapse functions/classes

### Perfect For
- Programming and development work
- Editing configuration files
- Working with multiple files at once
- Anyone who prefers GUI over terminal

## Quick Comparison

| Editor | Best For | Type | Learning Curve |
|--------|----------|------|----------------|
| **Kate** | Programming, GUI work | GUI | Easy |
| **Vim** | SSH, quick edits, power users | Terminal | Hard |
| **Nano** | Simple edits, beginners | Terminal | Very Easy |
| **VS Code** | Full IDE features | GUI | Easy |
| **Neovim** | Modern vim alternative | Terminal | Hard |

## Already Installed

Your system comes with **vim** by default. It's powerful but has a learning curve.

**Vim basics:**
- Open file: `vim filename`
- Enter insert mode: press `i`
- Save and quit: press `Esc`, then type `:wq` and Enter
- Quit without saving: press `Esc`, then type `:q!` and Enter

## Need More Info?

See the full [Editors Guide](./EDITORS-GUIDE.md) for:
- Detailed Kate features
- Complete comparison of all editors
- Configuration examples
- Tips and tricks
- Troubleshooting

## Common Tasks

### Launch Kate from Terminal
```bash
kate filename.txt
```

### Launch Kate with Multiple Files
```bash
kate file1.txt file2.txt file3.txt
```

### Open a Directory in Kate
```bash
kate .
```

### Make Kate Your Default GUI Editor
Add to your configuration:
```nix
environment.variables = {
  VISUAL = "kate";
};
```

## Getting Help

- Kate documentation: https://docs.kde.org/stable5/en/kate/kate/
- NixOS packages: https://search.nixos.org/packages
- Full guide: [docs/EDITORS-GUIDE.md](./EDITORS-GUIDE.md)

---

**Note**: Kate comes from the KDE desktop environment, but works perfectly fine on GNOME (which this system uses). It will just use GTK styling instead of Qt/KDE styling.
