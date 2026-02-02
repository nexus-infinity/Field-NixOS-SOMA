# System Image Export Guide

## Overview

This guide explains how to export Field-NixOS-SOMA configurations as deployable system images for various platforms.

## What is System Image Export?

System image export converts your NixOS configuration into a bootable or deployable image format that can be:
- Written to USB drives (ISO)
- Run in virtual machines (VM, VirtualBox, VMware)
- Deployed to cloud platforms (AWS, GCP, Azure)
- Packaged as containers (Docker)

## Prerequisites

### Required Tools
- NixOS with flakes enabled
- nixos-generators (installed automatically by build script)
- Sufficient disk space (varies by format, typically 2-10 GB)

### Configuration Requirements
- Valid flake.nix configuration
- All validation checks passing
- No critical errors in pre-deployment check

## Available Image Formats

### ISO Image
**Use Case**: Bootable installation media, USB drives  
**Output**: `.iso` file  
**Size**: ~800 MB - 2 GB  
**Platforms**: Any x86_64 system

**Build Command**:
```bash
./scripts/build-image.sh --config BearsiMac --format iso
```

**Usage**:
```bash
# Write to USB
sudo dd if=images/BearsiMac-iso-latest/iso/*.iso of=/dev/sdX bs=4M status=progress
sync
```

### VM Image
**Use Case**: QEMU virtual machines, testing  
**Output**: QCOW2 image with run script  
**Size**: ~1-3 GB  
**Platforms**: Any system with QEMU/KVM

**Build Command**:
```bash
./scripts/build-image.sh --config willowie --format vm
```

**Usage**:
```bash
# Run the VM
./images/willowie-vm-latest/bin/run-*-vm
```

### VirtualBox Image
**Use Case**: VirtualBox virtualization  
**Output**: `.ova` file  
**Size**: ~1-3 GB  
**Platforms**: Windows, macOS, Linux with VirtualBox

**Build Command**:
```bash
./scripts/build-image.sh --config BearsiMac --format virtualbox
```

**Usage**:
```bash
# Import in VirtualBox
VBoxManage import images/BearsiMac-virtualbox-latest/*.ova
```

### VMware Image
**Use Case**: VMware Workstation/Fusion/ESXi  
**Output**: `.vmdk` file  
**Size**: ~1-3 GB  
**Platforms**: VMware products

**Build Command**:
```bash
./scripts/build-image.sh --config soma-willowie --format vmware
```

### Amazon AMI
**Use Case**: AWS EC2 deployment  
**Output**: Raw disk image  
**Size**: ~1-2 GB  
**Platforms**: AWS

**Build Command**:
```bash
./scripts/build-image.sh --config willowie --format amazon
```

**Usage**:
1. Upload to S3
2. Import as AMI
3. Launch EC2 instance

### Docker Container
**Use Case**: Container deployments  
**Output**: Docker image tarball  
**Size**: ~500 MB - 2 GB  
**Platforms**: Any Docker-compatible system

**Build Command**:
```bash
./scripts/build-image.sh --config trident-dev --format docker
```

**Usage**:
```bash
# Load image
docker load < images/trident-dev-docker-latest
# Run container
docker run -it <image-name>
```

## Building Images

### Using the Build Script (Recommended)

The build script provides a user-friendly interface:

```bash
# Basic usage
./scripts/build-image.sh --config <CONFIG> --format <FORMAT>

# Examples
./scripts/build-image.sh --config BearsiMac --format iso
./scripts/build-image.sh --config willowie --format vm
./scripts/build-image.sh --config soma-willowie --format docker

# With custom output directory
./scripts/build-image.sh --config BearsiMac --format iso --output /tmp/images

# Skip validation (not recommended)
./scripts/build-image.sh --config BearsiMac --format iso --no-validation
```

### Manual nixos-generators Usage

For advanced users:

```bash
# Install nixos-generators
nix-shell -p nixos-generators

# Build ISO
nixos-generate -f iso --flake .#BearsiMac -o ./images/bearsi-iso

# Build VM
nixos-generate -f vm --flake .#willowie -o ./images/willowie-vm

# Build Docker
nixos-generate -f docker --flake .#soma-willowie -o ./images/soma-docker
```

## Testing Images

### ISO Testing

```bash
# Test in QEMU
qemu-system-x86_64 \
  -cdrom images/BearsiMac-iso-latest/iso/*.iso \
  -m 4096 \
  -enable-kvm
```

### VM Testing

```bash
# Run the generated VM
./images/willowie-vm-latest/bin/run-*-vm

# Or with custom settings
qemu-system-x86_64 \
  -drive file=images/willowie-vm-latest/nixos.qcow2,format=qcow2 \
  -m 4096 \
  -enable-kvm \
  -net nic -net user
```

### Docker Testing

```bash
# Load and run
docker load < images/trident-dev-docker-latest
docker images  # Find image name
docker run -it <image-name> /bin/bash
```

## Image Customization

### Adding Extra Packages

Edit your configuration before building:

```nix
# In nixosConfigurations/<hostname>/configuration.nix
environment.systemPackages = with pkgs; [
  vim
  git
  htop
  # Add packages needed in image
];
```

### Configuring for Specific Platforms

#### ISO Specific
```nix
# In configuration.nix (when building ISO)
isoImage.makeEfiBootable = true;
isoImage.makeUsbBootable = true;
```

#### Cloud Specific
```nix
# For cloud images
services.cloud-init.enable = true;
networking.firewall.enable = true;
```

#### Container Specific
```nix
# For Docker
boot.isContainer = true;
networking.useHostResolvConf = true;
```

## Integration with flake.nix

You can add image outputs directly to your flake:

```nix
# In flake.nix
{
  outputs = { self, nixpkgs, nixos-generators }: {
    # ... existing outputs ...
    
    # Add image outputs
    packages.x86_64-linux = {
      iso = nixos-generators.nixosGenerate {
        system = "x86_64-linux";
        format = "iso";
        modules = [
          ./nixosConfigurations/BearsiMac/configuration.nix
          ./hardware-configuration.nix
        ];
      };
      
      vm = nixos-generators.nixosGenerate {
        system = "x86_64-linux";
        format = "vm";
        modules = [
          ./nixosConfigurations/willowie/configuration.nix
          ./hardware-configuration.nix
        ];
      };
    };
  };
}
```

Then build with:
```bash
nix build .#iso
nix build .#vm
```

## Deployment Workflows

### USB Installation

1. **Build ISO**:
   ```bash
   ./scripts/build-image.sh --config BearsiMac --format iso
   ```

2. **Write to USB**:
   ```bash
   sudo dd if=images/BearsiMac-iso-latest/iso/*.iso of=/dev/sdX bs=4M status=progress
   sync
   ```

3. **Boot and Install**:
   - Boot from USB
   - Follow installation process
   - Configuration is already applied

### Cloud Deployment (AWS Example)

1. **Build AMI image**:
   ```bash
   ./scripts/build-image.sh --config willowie --format amazon
   ```

2. **Upload to S3**:
   ```bash
   aws s3 cp images/willowie-amazon-latest s3://my-bucket/willowie-ami/
   ```

3. **Import as AMI**:
   ```bash
   aws ec2 import-image \
     --description "Field-NixOS-SOMA Willowie" \
     --disk-containers file://container.json
   ```

4. **Launch EC2 instance**:
   ```bash
   aws ec2 run-instances \
     --image-id ami-xxxxx \
     --instance-type t3.medium \
     --key-name my-key
   ```

### Container Deployment

1. **Build Docker image**:
   ```bash
   ./scripts/build-image.sh --config trident-dev --format docker
   ```

2. **Load and tag**:
   ```bash
   docker load < images/trident-dev-docker-latest
   docker tag <image-id> myregistry/trident-dev:latest
   ```

3. **Push to registry**:
   ```bash
   docker push myregistry/trident-dev:latest
   ```

4. **Deploy**:
   ```bash
   docker run -d myregistry/trident-dev:latest
   ```

## Automation

### CI/CD Integration

Add to `.github/workflows/build-images.yml`:

```yaml
name: Build Images

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  build-iso:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cachix/install-nix-action@v24
        with:
          extra_nix_config: |
            experimental-features = nix-command flakes
      
      - name: Build ISO
        run: |
          ./scripts/build-image.sh --config BearsiMac --format iso --no-validation
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: nixos-iso
          path: images/BearsiMac-iso-latest/iso/*.iso
```

### Scheduled Builds

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

## Best Practices

### Pre-Build Checklist

- [ ] Run pre-deployment validation
- [ ] Ensure all modules evaluate correctly
- [ ] Test configuration in VM first
- [ ] Verify no secrets in configuration
- [ ] Update flake.lock if needed
- [ ] Check available disk space

### Image Security

- [ ] Remove any test credentials
- [ ] Disable password authentication for SSH
- [ ] Configure firewall rules
- [ ] Enable automatic security updates
- [ ] Use encrypted secrets (sops-nix/agenix)

### Image Distribution

- [ ] Document image contents and versions
- [ ] Provide checksums (SHA256)
- [ ] Sign images if distributing publicly
- [ ] Include FIRST-BOOT-README.md
- [ ] Test image on target platform

## Troubleshooting

### Build Fails

**Issue**: nixos-generators not found  
**Solution**: Install with `nix-shell -p nixos-generators`

**Issue**: Evaluation error during build  
**Solution**: Run `nix flake check` to identify issues

**Issue**: Out of disk space  
**Solution**: Clean up with `nix-collect-garbage -d`

### Image Won't Boot

**Issue**: ISO doesn't boot on UEFI systems  
**Solution**: Ensure `isoImage.makeEfiBootable = true;`

**Issue**: VM fails to start  
**Solution**: Check QEMU/KVM installation and permissions

### Image Too Large

**Issue**: Image exceeds expected size  
**Solution**: 
- Review installed packages
- Clean up unnecessary dependencies
- Use minimal base configuration

## Storage Management

### Image Location

Default: `./images/`

Structure:
```
images/
├── BearsiMac-iso-20240202-120000/
├── BearsiMac-iso-latest -> BearsiMac-iso-20240202-120000
├── willowie-vm-20240202-120000/
└── willowie-vm-latest -> willowie-vm-20240202-120000
```

### Cleanup

```bash
# Remove old images (keep latest)
find images/ -type d -mtime +30 -exec rm -rf {} +

# Remove all but latest symlinks
find images/ -type l -name "*-latest" -prune -o -type d -mtime +7 -print -exec rm -rf {} +
```

### Add to .gitignore

Images should not be committed:

```gitignore
# In .gitignore
images/
*.iso
*.qcow2
*.ova
*.vmdk
```

## References

- [nixos-generators Documentation](https://github.com/nix-community/nixos-generators)
- [NixOS Manual - Building Images](https://nixos.org/manual/nixos/stable/#sec-building-image)
- [Building ISO Images](https://nixos.wiki/wiki/Creating_a_NixOS_live_CD)
- [Build Script](../scripts/build-image.sh)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Maintainer**: Field-NixOS-SOMA Team
