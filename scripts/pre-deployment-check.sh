#!/usr/bin/env bash
# =============================================================================
# PRE-DEPLOYMENT CHECK SCRIPT
# =============================================================================
# Purpose: Comprehensive validation for stateless, deployment-ready NixOS SOMA
#
# This script validates:
# - No user data in /home
# - No non-flake-managed files in /etc/nixos/
# - No accidental secrets/credentials in git tracking
# - Configuration is clean and reproducible
# - System is ready for image export
# =============================================================================

set -eo pipefail

# ANSI color codes
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
CRITICAL_ERRORS=0

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

check_critical() {
    echo -e "${RED}  ${CROSS} [CRITICAL] $1${NC}"
    ((CRITICAL_ERRORS++)) || true
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
# Validation Functions
# =============================================================================

check_no_user_data() {
    print_section "Checking for User Data (STATELESS VALIDATION)"
    
    # Check if /home directory exists in repository
    if [[ -d "home" ]] || [[ -d "./home" ]]; then
        check_critical "User 'home' directory found in repository!"
        check_info "  Remove all user data from repository. This config must be stateless."
    else
        check_pass "No 'home' directory in repository"
    fi
    
    # Check for common user file patterns
    local user_patterns=(
        "*.bash_history"
        "*.zsh_history"
        ".ssh/id_*"
        ".gnupg/*"
        "Documents/*"
        "Downloads/*"
        ".config/*/session"
        ".local/share/*/history"
    )
    
    local found_user_files=0
    for pattern in "${user_patterns[@]}"; do
        if find . -path "*/$pattern" -not -path "*/.git/*" 2>/dev/null | grep -q .; then
            ((found_user_files++)) || true
            check_warn "Found user files matching: $pattern"
        fi
    done
    
    if [[ $found_user_files -eq 0 ]]; then
        check_pass "No user-specific files detected"
    else
        check_fail "$found_user_files types of user files found"
        check_info "  User files should not be in NixOS system configuration"
    fi
}

check_no_non_flake_files() {
    print_section "Checking for Non-Flake-Managed Files"
    
    # Check for common non-flake-managed configuration files
    local non_flake_patterns=(
        "configuration.nix.backup"
        "configuration.nix.old"
        "*.backup"
        "*.bak"
        "*.orig"
    )
    
    local found_backups=0
    for pattern in "${non_flake_patterns[@]}"; do
        if find . -name "$pattern" -not -path "*/.git/*" 2>/dev/null | grep -q .; then
            ((found_backups++)) || true
            check_warn "Found backup/non-flake file: $pattern"
            find . -name "$pattern" -not -path "*/.git/*" 2>/dev/null | while read -r file; do
                check_info "  $file"
            done
        fi
    done
    
    if [[ $found_backups -eq 0 ]]; then
        check_pass "No backup or non-flake files detected"
    else
        check_warn "$found_backups types of backup files found - clean these before deployment"
    fi
    
    # Verify flake.nix exists
    if [[ -f "flake.nix" ]]; then
        check_pass "Flake.nix exists (flake-managed configuration)"
    else
        check_critical "flake.nix not found! System must be flake-managed"
    fi
}

check_secrets_not_tracked() {
    print_section "Checking for Accidentally Tracked Secrets"
    
    # Patterns that might indicate secrets
    local secret_patterns=(
        "password"
        "passwd"
        "secret"
        "api[_-]?key"
        "api[_-]?token"
        "access[_-]?token"
        "private[_-]?key"
        "SECRET"
        "PRIVATE"
        "TOKEN"
    )
    
    check_info "Scanning git-tracked files for potential secrets..."
    
    local found_secrets=0
    for pattern in "${secret_patterns[@]}"; do
        # Search in git-tracked files only
        if git grep -i "$pattern" 2>/dev/null | grep -v "\.gitignore" | grep -v "README" | grep -v "^scripts/" | grep -v "# " | head -5 | grep -q .; then
            ((found_secrets++)) || true
            check_warn "Found potential secret pattern: $pattern"
            git grep -i "$pattern" 2>/dev/null | grep -v "\.gitignore" | grep -v "README" | grep -v "^scripts/" | grep -v "# " | head -3 | while read -r line; do
                check_info "  $(echo "$line" | cut -c1-100)"
            done
        fi
    done
    
    if [[ $found_secrets -eq 0 ]]; then
        check_pass "No obvious secret patterns found in tracked files"
    else
        check_warn "$found_secrets potential secret patterns detected - review carefully"
        check_info "  These may be false positives (documentation, comments, etc.)"
    fi
    
    # Check for files with 'secret' or 'key' in name
    if git ls-files | grep -iE "(secret|\.key$|\.pem$|id_rsa|id_ed25519)" | grep -q .; then
        check_critical "Files with secret-like names are tracked in git!"
        git ls-files | grep -iE "(secret|\.key$|\.pem$|id_rsa|id_ed25519)" | while read -r file; do
            check_info "  $file"
        done
    else
        check_pass "No secret-like filenames in git tracking"
    fi
}

check_secrets_directory() {
    print_section "Checking Secrets Directory Configuration"
    
    if [[ -d "secrets" ]]; then
        check_pass "Secrets directory exists"
        
        # Check if secrets/.gitignore exists
        if [[ -f "secrets/.gitignore" ]]; then
            check_pass "Secrets directory has .gitignore"
        else
            check_warn "Secrets directory missing .gitignore"
            check_info "  Create secrets/.gitignore to prevent accidental commits"
        fi
        
        # Check if any secrets are accidentally tracked
        if git ls-files secrets/ 2>/dev/null | grep -v "README.md" | grep -v ".gitignore" | grep -q .; then
            check_critical "Secret files are being tracked in git!"
            git ls-files secrets/ | grep -v "README.md" | grep -v ".gitignore" | while read -r file; do
                check_info "  $file"
            done
        else
            check_pass "No secret files tracked in git (only README/gitignore)"
        fi
    else
        check_warn "Secrets directory doesn't exist"
        check_info "  Create secrets/ directory for proper secrets management"
    fi
}

check_reproducible_configuration() {
    print_section "Checking Configuration Reproducibility"
    
    # Check flake.lock exists
    if [[ -f "flake.lock" ]]; then
        check_pass "flake.lock exists (pinned dependencies)"
    else
        check_warn "flake.lock missing - dependencies not pinned"
        check_info "  Run 'nix flake update' to create flake.lock"
    fi
    
    # Check for absolute paths (anti-pattern in reproducible configs)
    check_info "Scanning for absolute paths in Nix files..."
    if find . -name "*.nix" -not -path "*/.git/*" -type f -exec grep -l "/home/" {} \; 2>/dev/null | grep -q .; then
        check_warn "Found absolute /home/ paths in Nix files"
        find . -name "*.nix" -not -path "*/.git/*" -type f -exec grep -l "/home/" {} \; 2>/dev/null | head -5 | while read -r file; do
            check_info "  $file"
        done
        check_info "  Use relative paths or \${config.users.users.<user>.home} instead"
    else
        check_pass "No absolute /home/ paths in Nix files"
    fi
    
    # Check for hardcoded system paths
    if find . -name "*.nix" -not -path "*/.git/*" -type f -exec grep -l "/mnt/" {} \; 2>/dev/null | grep -q .; then
        check_warn "Found absolute /mnt/ paths in Nix files"
        find . -name "*.nix" -not -path "*/.git/*" -type f -exec grep -l "/mnt/" {} \; 2>/dev/null | head -3 | while read -r file; do
            check_info "  $file"
        done
        check_info "  These may need to be parameterized for different deployments"
    fi
}

check_directory_structure() {
    print_section "Checking Directory Structure (Recommended Layout)"
    
    # Required directories
    local required_dirs=(
        "chakras"
        "modules/services"
        "modules/system"
        "scripts"
        "docs"
    )
    
    # Recommended directories
    local recommended_dirs=(
        "hardware"
        "overlays"
        "secrets"
        "docs/runbooks"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            check_pass "Directory exists: $dir/"
        else
            check_fail "Missing required directory: $dir/"
        fi
    done
    
    for dir in "${recommended_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            check_pass "Directory exists: $dir/"
        else
            check_warn "Missing recommended directory: $dir/"
        fi
    done
}

check_documentation() {
    print_section "Checking Documentation Completeness"
    
    local required_docs=(
        "README.md"
        "flake.nix"
    )
    
    local recommended_docs=(
        "docs/runbooks"
        "hardware/README.md"
        "secrets/README.md"
    )
    
    for doc in "${required_docs[@]}"; do
        if [[ -f "$doc" ]] || [[ -d "$doc" ]]; then
            check_pass "Found: $doc"
        else
            check_fail "Missing required: $doc"
        fi
    done
    
    for doc in "${recommended_docs[@]}"; do
        if [[ -f "$doc" ]] || [[ -d "$doc" ]]; then
            check_pass "Found: $doc"
        else
            check_warn "Missing recommended: $doc"
        fi
    done
}

check_clean_git_status() {
    print_section "Checking Git Repository Status"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        check_warn "Not a git repository"
        return
    fi
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
        check_info "  Commit all changes before deployment"
    fi
    
    # Check for untracked files that should be committed
    local untracked=$(git ls-files --others --exclude-standard)
    if [[ -z "$untracked" ]]; then
        check_pass "No untracked files"
    else
        check_info "Untracked files exist - verify these should not be committed:"
        echo "$untracked" | head -10 | while read -r file; do
            check_info "  $file"
        done
    fi
}

generate_deployment_checklist() {
    print_section "Deployment Readiness Checklist"
    
    echo ""
    echo -e "${CYAN}Before deploying this configuration:${NC}"
    echo ""
    echo "  1. ✅ All secrets are encrypted and not in git"
    echo "  2. ✅ No user data in /home or personal files"
    echo "  3. ✅ Configuration is entirely flake-managed"
    echo "  4. ✅ flake.lock exists with pinned dependencies"
    echo "  5. ✅ All changes are committed to git"
    echo "  6. ✅ Hardware configuration will be generated on target"
    echo "  7. ✅ Documentation is complete and up-to-date"
    echo ""
}

print_summary() {
    print_header "PRE-DEPLOYMENT CHECK SUMMARY"
    
    echo ""
    echo -e "${GREEN}Passed:           $PASSED${NC}"
    echo -e "${YELLOW}Warnings:         $WARNINGS${NC}"
    echo -e "${RED}Errors:           $ERRORS${NC}"
    if [[ $CRITICAL_ERRORS -gt 0 ]]; then
        echo -e "${RED}Critical Errors:  $CRITICAL_ERRORS${NC}"
    fi
    echo ""
    
    if [[ $CRITICAL_ERRORS -gt 0 ]]; then
        echo -e "${RED}❌ DEPLOYMENT BLOCKED - Critical errors must be resolved${NC}"
        echo ""
        echo "Critical issues prevent safe deployment. Fix these first:"
        echo "  - Remove any user data from repository"
        echo "  - Remove accidentally committed secrets"
        echo "  - Ensure flake-based configuration"
        echo ""
        return 2
    elif [[ $ERRORS -gt 0 ]]; then
        echo -e "${RED}❌ NOT READY FOR DEPLOYMENT - Errors must be resolved${NC}"
        echo ""
        return 1
    elif [[ $WARNINGS -gt 5 ]]; then
        echo -e "${YELLOW}⚠️  DEPLOYMENT POSSIBLE WITH CAUTION - Review warnings${NC}"
        echo ""
        echo "Multiple warnings detected. Review carefully before deploying."
        echo ""
        return 0
    else
        echo -e "${GREEN}✅ READY FOR DEPLOYMENT${NC}"
        echo ""
        echo "Configuration passes stateless deployment validation!"
        echo ""
        return 0
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_header "🔒 Pre-Deployment Validation - SOMA Stateless NixOS"
    echo -e "${CYAN}Validating: $(pwd)${NC}"
    echo -e "${CYAN}Purpose: Ensure clean, stateless, deployment-ready configuration${NC}"
    
    # Run all validation checks
    check_directory_structure
    check_no_user_data
    check_no_non_flake_files
    check_secrets_directory
    check_secrets_not_tracked
    check_reproducible_configuration
    check_documentation
    check_clean_git_status
    
    # Generate checklist
    generate_deployment_checklist
    
    # Print summary and exit
    print_summary
    exit_code=$?
    
    echo ""
    print_header "End of Pre-Deployment Check"
    
    exit $exit_code
}

# Run main function
main "$@"
