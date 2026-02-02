#!/usr/bin/env bash
# =============================================================================
# BUILD IMAGE SCRIPT
# =============================================================================
# Purpose: Build deployable system images using nixos-generators
#
# Supported formats:
# - iso: Bootable ISO image
# - vm: QEMU virtual machine image
# - vmware: VMware image
# - virtualbox: VirtualBox image
# - amazon: AWS AMI
# - docker: Docker container image
# =============================================================================

set -eo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Symbols
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${REPO_DIR}/images"

# Available configurations
CONFIGS=("BearsiMac" "willowie" "soma-willowie" "trident-dev")

# Available image formats
FORMATS=("iso" "vm" "vmware" "virtualbox" "amazon" "docker")

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}  ${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}  ${CROSS} $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}  ${WARN} $1${NC}"
}

print_info() {
    echo -e "${CYAN}  ${INFO} $1${NC}"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build deployable NixOS system images for Field-NixOS-SOMA configurations.

OPTIONS:
    -c, --config CONFIG       Configuration to build (${CONFIGS[*]})
    -f, --format FORMAT       Image format (${FORMATS[*]})
    -o, --output DIR          Output directory (default: $OUTPUT_DIR)
    -n, --no-validation       Skip pre-build validation
    -h, --help                Show this help message

EXAMPLES:
    # Build ISO for BearsiMac
    $0 --config BearsiMac --format iso

    # Build VM image for willowie
    $0 --config willowie --format vm

    # Build Docker image for soma-willowie
    $0 --config soma-willowie --format docker

    # Build with custom output directory
    $0 --config BearsiMac --format iso --output /tmp/images

NOTES:
    - Requires nixos-generators to be available
    - Images are saved to ./images/ by default
    - Run pre-deployment validation before building (recommended)

EOF
    exit 0
}

check_dependencies() {
    print_step "Checking Dependencies"
    
    # Check if nix is available
    if command -v nix &> /dev/null; then
        print_success "Nix is installed"
    else
        print_error "Nix is not installed"
        print_info "Install from: https://nixos.org/download.html"
        exit 1
    fi
    
    # Check if flakes are enabled
    if nix flake --version &> /dev/null; then
        print_success "Flakes are enabled"
    else
        print_error "Flakes are not enabled"
        print_info "Add to /etc/nix/nix.conf: experimental-features = nix-command flakes"
        exit 1
    fi
    
    # Check if nixos-generators is available
    if nix-shell -p nixos-generators --run "nixos-generate --version" &> /dev/null; then
        print_success "nixos-generators is available"
    else
        print_warn "nixos-generators not installed (will install automatically)"
    fi
}

validate_config() {
    local config=$1
    
    print_step "Validating Configuration: $config"
    
    # Check if configuration exists in flake
    if nix eval ".#nixosConfigurations.${config}.config.system.name" &> /dev/null; then
        print_success "Configuration exists in flake"
    else
        print_error "Configuration '$config' not found in flake"
        print_info "Available configs: ${CONFIGS[*]}"
        exit 1
    fi
    
    # Check if hardware-configuration.nix exists
    if [[ ! -f "${REPO_DIR}/hardware-configuration.nix" ]]; then
        print_warn "hardware-configuration.nix not found"
        print_info "Creating stub configuration for image build..."
        create_stub_hardware_config
    else
        print_success "Hardware configuration exists"
    fi
}

create_stub_hardware_config() {
    cat > "${REPO_DIR}/hardware-configuration.nix" <<'EOF'
# Stub hardware configuration for image builds
# This will be replaced on the target system
{ config, lib, pkgs, modulesPath, ... }:
{
  imports = [ (modulesPath + "/profiles/qemu-guest.nix") ];
  
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/sda";
  
  fileSystems."/" = {
    device = "/dev/disk/by-label/nixos";
    fsType = "ext4";
  };
  
  fileSystems."/boot" = {
    device = "/dev/disk/by-label/boot";
    fsType = "vfat";
  };
  
  swapDevices = [ ];
  
  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";
}
EOF
    print_success "Created stub hardware-configuration.nix"
}

run_validation() {
    print_step "Running Pre-Build Validation"
    
    if [[ -x "${SCRIPT_DIR}/pre-deployment-check.sh" ]]; then
        if "${SCRIPT_DIR}/pre-deployment-check.sh"; then
            print_success "Pre-deployment validation passed"
        else
            print_error "Pre-deployment validation failed"
            print_info "Fix issues or use --no-validation to skip"
            exit 1
        fi
    else
        print_warn "Pre-deployment check script not found"
        print_info "Skipping validation..."
    fi
}

build_image() {
    local config=$1
    local format=$2
    local output_dir=$3
    
    print_header "Building Image"
    print_info "Configuration: $config"
    print_info "Format: $format"
    print_info "Output: $output_dir"
    
    # Create output directory
    mkdir -p "$output_dir"
    
    # Build the image
    print_step "Building $format image for $config..."
    
    local output_name="${config}-${format}-$(date +%Y%m%d-%H%M%S)"
    
    cd "$REPO_DIR"
    
    if nix-shell -p nixos-generators --run \
        "nixos-generate -f $format --flake .#$config -o $output_dir/$output_name"; then
        print_success "Image built successfully"
        print_info "Location: $output_dir/$output_name"
        
        # Create symlink to latest
        ln -sf "$output_name" "$output_dir/${config}-${format}-latest"
        print_info "Symlink: $output_dir/${config}-${format}-latest"
        
        # Show size
        if [[ -d "$output_dir/$output_name" ]]; then
            local size=$(du -sh "$output_dir/$output_name" | cut -f1)
            print_info "Size: $size"
        fi
        
        # Format-specific instructions
        print_format_instructions "$config" "$format" "$output_dir/$output_name"
        
        return 0
    else
        print_error "Image build failed"
        return 1
    fi
}

print_format_instructions() {
    local config=$1
    local format=$2
    local output_path=$3
    
    print_step "Next Steps"
    
    case $format in
        iso)
            cat << EOF
To use this ISO image:

1. Write to USB:
   sudo dd if=$output_path/iso/*.iso of=/dev/sdX bs=4M status=progress
   sync

2. Boot from USB and install

3. During installation, this configuration will be applied automatically

EOF
            ;;
        vm)
            cat << EOF
To run this VM image:

1. Execute the VM:
   $output_path/bin/run-*-vm

2. The VM will start with the configuration applied

3. Login credentials (if configured in your NixOS config)

EOF
            ;;
        docker)
            cat << EOF
To use this Docker image:

1. Load the image:
   docker load < $output_path

2. Run a container:
   docker run -it <image-name>

EOF
            ;;
        amazon)
            cat << EOF
To use this AMI:

1. Upload to S3:
   aws s3 cp $output_path s3://your-bucket/

2. Import as AMI:
   aws ec2 import-image --disk-containers file://container.json

3. Launch EC2 instance from AMI

EOF
            ;;
        virtualbox)
            cat << EOF
To use this VirtualBox image:

1. Import the OVA:
   VBoxManage import $output_path/*.ova

2. Start the VM from VirtualBox Manager

EOF
            ;;
        vmware)
            cat << EOF
To use this VMware image:

1. Import the VMDK:
   - Open VMware
   - File > Open > Select VMDK

2. Configure VM settings as needed

3. Start the VM

EOF
            ;;
    esac
}

cleanup() {
    # Optionally remove stub hardware config if it was created
    if [[ -f "${REPO_DIR}/hardware-configuration.nix" ]]; then
        if grep -q "Stub hardware configuration for image builds" "${REPO_DIR}/hardware-configuration.nix"; then
            print_info "Cleaning up stub hardware-configuration.nix"
            rm -f "${REPO_DIR}/hardware-configuration.nix"
        fi
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    local config=""
    local format=""
    local output="$OUTPUT_DIR"
    local skip_validation=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--config)
                config="$2"
                shift 2
                ;;
            -f|--format)
                format="$2"
                shift 2
                ;;
            -o|--output)
                output="$2"
                shift 2
                ;;
            -n|--no-validation)
                skip_validation=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                ;;
        esac
    done
    
    # Validate arguments
    if [[ -z "$config" ]] || [[ -z "$format" ]]; then
        print_error "Configuration and format are required"
        usage
    fi
    
    # Validate config name
    if [[ ! " ${CONFIGS[*]} " =~ " ${config} " ]]; then
        print_error "Invalid configuration: $config"
        print_info "Available: ${CONFIGS[*]}"
        exit 1
    fi
    
    # Validate format
    if [[ ! " ${FORMATS[*]} " =~ " ${format} " ]]; then
        print_error "Invalid format: $format"
        print_info "Available: ${FORMATS[*]}"
        exit 1
    fi
    
    print_header "Field-NixOS-SOMA Image Builder"
    
    # Check dependencies
    check_dependencies
    
    # Validate configuration
    validate_config "$config"
    
    # Run validation unless skipped
    if [[ "$skip_validation" == false ]]; then
        run_validation
    else
        print_warn "Skipping validation (--no-validation)"
    fi
    
    # Build image
    if build_image "$config" "$format" "$output"; then
        print_header "Build Complete"
        print_success "Image ready for deployment"
        cleanup
        exit 0
    else
        print_header "Build Failed"
        print_error "See errors above"
        cleanup
        exit 1
    fi
}

# Run main function
main "$@"
