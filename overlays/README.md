# Nix Overlays

This directory contains Nix package overlays for custom packages and modifications.

## Purpose

Overlays allow you to:
- Add custom packages not in nixpkgs
- Modify existing nixpkgs packages
- Override package versions or build options
- Apply patches to upstream packages

## Structure

```
overlays/
├── README.md              # This file
├── default.nix            # Main overlay aggregator
├── custom-packages/       # Custom package definitions
└── modifications/         # Package modifications
```

## Usage

Overlays are applied in `flake.nix`:

```nix
nixpkgs.overlays = [
  (import ./overlays)
];
```

Or for specific packages:

```nix
nixpkgs.overlays = [
  (self: super: {
    myCustomPackage = self.callPackage ./overlays/custom-packages/my-package.nix {};
  })
];
```

## Creating Overlays

Basic overlay structure:

```nix
# overlays/default.nix
final: prev: {
  # Add new package
  myPackage = final.callPackage ./custom-packages/my-package.nix {};
  
  # Modify existing package
  vim = prev.vim.override {
    lua = final.lua5_4;
  };
}
```

## Best Practices

1. **Keep overlays minimal**: Only override what's necessary
2. **Document changes**: Add comments explaining why modifications are needed
3. **Test builds**: Ensure overlays don't break existing packages
4. **Version pin carefully**: Document version requirements and reasons
5. **Avoid side effects**: Overlays should be pure and reproducible

## Stateless Deployment

For clean, reproducible builds:
- Overlays should be declarative and version-controlled
- Avoid downloading external sources without proper hashing
- All custom packages should be fully specified
- No build-time network dependencies (use fixed-output derivations)
