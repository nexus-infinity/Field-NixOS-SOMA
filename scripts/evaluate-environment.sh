#!/usr/bin/env bash
# =============================================================================
# ENVIRONMENT EVALUATION SCRIPT
# =============================================================================
# Purpose: Comprehensive pre-build validation and environment assessment
# for iNixOS-Willowie NixOS configuration
#
# This script evaluates:
# - Nix installation and experimental features
# - Flake structure and validity
# - File dependencies and references
# - Service module definitions
# - Chakra configuration consistency
# =============================================================================

set -eo pipefail

# ANSI color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Symbols
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

# State variables
NIX_AVAILABLE=false

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

check_pass() {
    echo -e "${GREEN}  ${CHECK} $1${NC}"
    ((PASSED++)) || true
}

check_fail() {
    echo -e "${RED}  ${CROSS} $1${NC}"
    ((ERRORS++)) || true
}

check_warn() {
    echo -e "${YELLOW}  ${WARN} $1${NC}"
    ((WARNINGS++)) || true
}

check_info() {
    echo -e "${CYAN}  ${INFO} $1${NC}"
}

# =============================================================================
# Evaluation Functions
# =============================================================================

check_nix_installation() {
    print_section "Checking Nix Installation"
    
    set +e  # Temporarily disable exit on error
    command -v nix &> /dev/null
    local nix_found=$?
    set -e  # Re-enable exit on error
    
    if [[ $nix_found -eq 0 ]]; then
        NIX_VERSION=$(nix --version 2>&1 || echo "unknown")
        check_pass "Nix is installed: $NIX_VERSION"
        NIX_AVAILABLE=true
        
        # Check for experimental features
        set +e
        nix flake --version &> /dev/null 2>&1
        local flakes_enabled=$?
        set -e
        
        if [[ $flakes_enabled -eq 0 ]]; then
            check_pass "Experimental features (flakes) are enabled"
        else
            check_warn "Experimental features may not be enabled"
            check_info "Enable with: nix.settings.experimental-features = [ \"nix-command\" \"flakes\" ];"
        fi
    else
        check_warn "Nix is not installed or not in PATH"
        check_info "Install Nix from: https://nixos.org/download.html"
        check_info "Continuing with checks that don't require Nix..."
        NIX_AVAILABLE=false
    fi
}

check_directory_structure() {
    print_section "Checking Directory Structure"
    
    local required_dirs=("chakras" "dot-hive" "modules" "nixosConfigurations" "scripts" "sacred_geometry")
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            check_pass "Directory exists: $dir/"
        else
            check_fail "Missing directory: $dir/"
        fi
    done
}

check_flake_structure() {
    print_section "Checking Flake Structure"
    
    # Check main flake.nix
    if [[ -f "flake.nix" ]]; then
        check_pass "Main flake.nix exists"
        
        # Check for required sections
        if grep -q "inputs =" flake.nix; then
            check_pass "Flake inputs section found"
        else
            check_fail "Flake inputs section missing"
        fi
        
        if grep -q "outputs =" flake.nix; then
            check_pass "Flake outputs section found"
        else
            check_fail "Flake outputs section missing"
        fi
        
        if grep -q "nixosConfigurations" flake.nix; then
            check_pass "NixOS configurations defined"
        else
            check_fail "No NixOS configurations found"
        fi
    else
        check_fail "Main flake.nix not found"
    fi
    
    # Check dot-hive aggregator
    if [[ -f "dot-hive/default.nix" ]]; then
        check_pass "dot-hive aggregator module exists"
    else
        check_fail "dot-hive/default.nix not found"
    fi
}

check_hardware_configuration() {
    print_section "Checking Hardware Configuration"
    
    if [[ -f "hardware-configuration.nix" ]]; then
        check_pass "hardware-configuration.nix exists"
        
        # Validate it has required sections
        if grep -q "boot.initrd" hardware-configuration.nix; then
            check_pass "Boot configuration found in hardware-configuration.nix"
        else
            check_warn "No boot configuration in hardware-configuration.nix"
        fi
    else
        check_warn "hardware-configuration.nix not found (hardware-specific, not in git)"
        check_info "Create with: nixos-generate-config --show-hardware-config > hardware-configuration.nix"
        check_info "Or use: hardware-configuration.nix.template as a starting point"
    fi
}

check_chakra_modules() {
    print_section "Checking Chakra Modules"
    
    local chakras=("muladhara" "svadhisthana" "manipura" "anahata" "vishuddha" "ajna" "sahasrara" "soma" "jnana")
    local chakra_count=0
    
    for chakra in "${chakras[@]}"; do
        if [[ -d "chakras/$chakra" ]]; then
            ((chakra_count++)) || true
            
            # Check for configuration files
            if [[ -f "chakras/$chakra/default.nix" ]]; then
                check_pass "Chakra $chakra: default.nix exists"
            else
                check_fail "Chakra $chakra: default.nix missing"
            fi
            
            # Check for flake.nix (optional but recommended)
            if [[ -f "chakras/$chakra/flake.nix" ]]; then
                check_info "Chakra $chakra: has flake.nix (standalone capability)"
            fi
        else
            check_fail "Chakra directory missing: $chakra"
        fi
    done
    
    check_info "Found $chakra_count of ${#chakras[@]} chakra modules"
}

check_service_modules() {
    print_section "Checking Service Module Definitions"
    
    local services=("dojoNodes" "metatronCube" "atlasFrontend" "tata8i-pulse-engine")
    
    check_info "Checking for custom service definitions..."
    
    for service in "${services[@]}"; do
        # Search for service module definitions
        if find modules -name "*.nix" -type f -exec grep -l "services\\.${service}" {} \; 2>/dev/null | grep -q .; then
            check_pass "Service module found: $service"
        else
            check_warn "Service module not defined: $service"
            check_info "  Referenced in configuration but module definition missing"
        fi
    done
}

check_file_references() {
    print_section "Checking File References"
    
    # Check imports in main flake
    if grep -q "hardware-configuration.nix" flake.nix; then
        if [[ ! -f "hardware-configuration.nix" ]]; then
            check_warn "flake.nix references hardware-configuration.nix but file is missing"
            check_info "  This is expected - hardware-configuration.nix is hardware-specific"
        else
            check_pass "hardware-configuration.nix reference is valid"
        fi
    fi
    
    # Check for broken symlinks
    if find . -type l -! -exec test -e {} \; -print 2>/dev/null | grep -q .; then
        check_warn "Broken symlinks detected:"
        find . -type l -! -exec test -e {} \; -print 2>/dev/null | while read -r link; do
            check_info "  $link"
        done
    else
        check_pass "No broken symlinks found"
    fi
}

check_nix_syntax() {
    print_section "Checking Nix Syntax"
    
    if [[ "${NIX_AVAILABLE:-false}" != "true" ]]; then
        check_warn "Cannot validate Nix syntax - Nix not installed"
        return
    fi
    
    local nix_files
    nix_files=$(find . -name "*.nix" -type f ! -path "*/.*" ! -path "*/result/*" 2>/dev/null)
    
    local syntax_errors=0
    local files_checked=0
    
    while IFS= read -r file; do
        ((files_checked++)) || true
        if nix-instantiate --parse "$file" &>/dev/null; then
            : # Syntax OK - don't spam output
        else
            check_fail "Syntax error in: $file"
            ((syntax_errors++)) || true
        fi
    done <<< "$nix_files"
    
    if [[ $syntax_errors -eq 0 ]]; then
        check_pass "All $files_checked Nix files have valid syntax"
    else
        check_fail "$syntax_errors files have syntax errors out of $files_checked checked"
    fi
}

validate_flake() {
    print_section "Validating Flake Metadata"
    
    if [[ "${NIX_AVAILABLE:-false}" != "true" ]]; then
        check_warn "Cannot validate flake - Nix not installed"
        return
    fi
    
    # Try to evaluate flake metadata
    if nix flake metadata . --no-write-lock-file &>/dev/null 2>&1; then
        check_pass "Flake metadata is valid"
        
        # Show flake info
        check_info "Flake outputs:"
        nix flake show . --no-write-lock-file 2>/dev/null | head -20 | while read -r line; do
            check_info "  $line"
        done || true
    else
        check_warn "Flake metadata validation failed (may be due to missing hardware-configuration.nix)"
        check_info "This is expected if hardware-configuration.nix hasn't been generated yet"
    fi
}

generate_recommendations() {
    print_section "Generating Recommendations"
    
    echo ""
    
    if [[ ! -f "hardware-configuration.nix" ]]; then
        echo -e "${CYAN}RECOMMENDATION: Generate hardware-configuration.nix${NC}"
        echo "  On the target NixOS system, run:"
        echo "    sudo nixos-generate-config --show-hardware-config > hardware-configuration.nix"
        echo ""
    fi
    
    if [[ $ERRORS -gt 0 ]] || [[ $WARNINGS -gt 5 ]]; then
        echo -e "${CYAN}RECOMMENDATION: Review and fix issues${NC}"
        echo "  Address critical errors before attempting to build"
        echo "  See above output for specific issues"
        echo ""
    fi
    
    if ! grep -q "experimental-features" /etc/nix/nix.conf 2>/dev/null && \
       ! grep -q "experimental-features" ~/.config/nix/nix.conf 2>/dev/null; then
        echo -e "${CYAN}RECOMMENDATION: Enable experimental features${NC}"
        echo "  Add to /etc/nix/nix.conf or ~/.config/nix/nix.conf:"
        echo "    experimental-features = nix-command flakes"
        echo ""
    fi
    
    echo -e "${CYAN}NEXT STEPS:${NC}"
    echo "  1. Fix any errors identified above"
    echo "  2. Generate hardware-configuration.nix on target system"
    echo "  3. Review and customize nixosConfigurations/BearsiMac/configuration.nix"
    echo "  4. Test build with: nix build .#nixosConfigurations.BearsiMac.config.system.build.toplevel"
    echo "  5. Deploy with: sudo nixos-rebuild switch --flake .#BearsiMac"
    echo ""
}

print_summary() {
    print_header "EVALUATION SUMMARY"
    
    echo ""
    echo -e "${GREEN}Passed:   $PASSED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "${RED}Errors:   $ERRORS${NC}"
    echo ""
    
    if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -lt 5 ]]; then
        echo -e "${GREEN}${CHECK} Configuration looks good! Ready for build (after hardware-config generation).${NC}"
        return 0
    elif [[ $ERRORS -eq 0 ]]; then
        echo -e "${YELLOW}${WARN} Configuration has warnings but should be buildable.${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Configuration has errors that need to be addressed.${NC}"
        return 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_header "🌀 iNixOS-Willowie Environment Evaluation"
    echo -e "${CYAN}Sacred Geometry Bridge - Configuration Assessment${NC}"
    echo -e "${CYAN}Evaluating: $(pwd)${NC}"
    
    # Run all checks
    check_nix_installation
    check_directory_structure
    check_flake_structure
    check_hardware_configuration
    check_chakra_modules
    check_service_modules
    check_file_references
    check_nix_syntax
    validate_flake
    
    # Generate recommendations
    generate_recommendations
    
    # Print summary
    print_summary
    exit_code=$?
    
    echo ""
    print_header "End of Evaluation"
    
    exit $exit_code
}

# Run main function
main "$@"
