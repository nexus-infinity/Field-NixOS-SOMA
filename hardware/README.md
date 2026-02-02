# Hardware Profiles

This directory contains hardware-specific NixOS configurations for different target systems.

## Purpose

Hardware profiles define device-specific settings including:
- Boot loader configuration
- Kernel modules and drivers
- File system mounts
- CPU and GPU optimizations
- Power management settings
- Input devices and peripherals

## Structure

Each hardware profile should be in its own subdirectory:

```
hardware/
├── README.md                    # This file
├── imac-2019/                   # iMac 2019 profile
│   └── hardware-configuration.nix
├── generic-x86_64/              # Generic x86_64 profile
│   └── hardware-configuration.nix
└── templates/                   # Template configurations
    └── hardware-configuration.nix.template
```

## Usage

Hardware configurations are typically generated with:

```bash
sudo nixos-generate-config --show-hardware-config > hardware/YOUR-SYSTEM/hardware-configuration.nix
```

Then referenced in your system configuration:

```nix
# In flake.nix
modules = [
  ./hardware/imac-2019/hardware-configuration.nix
  # ... other modules
];
```

## Best Practices

1. **Never commit sensitive data**: Hardware configs should not contain passwords, keys, or tokens
2. **Keep it hardware-specific**: Only include settings specific to the physical hardware
3. **Use templates**: For new installations, copy from templates/ and customize
4. **Document quirks**: Add comments for hardware-specific workarounds or settings

## Stateless Deployment

For deployment-ready systems:
- Hardware configs should be generated on the target system
- Templates provide a starting point for common hardware
- No user-specific settings should be in hardware profiles
- All settings should be reproducible and declarative
