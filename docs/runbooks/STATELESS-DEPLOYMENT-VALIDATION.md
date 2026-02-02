# Stateless Deployment Validation

## Purpose

This runbook provides procedures for validating that Field-NixOS-SOMA maintains stateless, reproducible deployment characteristics throughout its lifecycle.

## What is Stateless Deployment?

A stateless deployment means:
- **No user content**: System contains only infrastructure code, no /home directories or personal files
- **Fully reproducible**: Configuration can be rebuilt identically from source
- **Declarative**: Everything is specified in NixOS configuration files
- **Version controlled**: All configuration in git, no manual changes
- **Secrets managed**: Credentials encrypted, injected at deployment time
- **Image exportable**: System can be converted to deployable images

## Validation Procedures

### Procedure 1: Pre-Commit Validation

**When**: Before committing changes to git  
**Frequency**: Every commit  
**Time**: 2-3 minutes

#### Steps

1. **Run pre-deployment check**:
   ```bash
   ./scripts/pre-deployment-check.sh
   ```

2. **Verify output**:
   - ✅ No critical errors
   - ✅ No user data detected
   - ✅ No secrets in tracking

3. **Review warnings**:
   - Address any warnings that indicate stateless violations
   - Document accepted warnings (if any)

4. **Check git status**:
   ```bash
   git status
   git diff
   ```

5. **Verify files to commit**:
   - Only .nix files, documentation, scripts
   - No .log, .tmp, personal files
   - No secrets, keys, credentials

#### Expected Results
- Pre-deployment check passes
- Only infrastructure files staged
- No user content in changeset

#### Failure Actions
- **Critical errors**: Fix before committing
- **User data found**: Remove and update .gitignore
- **Secrets detected**: Remove, rotate credentials, update .gitignore

---

### Procedure 2: Pull Request Validation

**When**: Before merging a PR  
**Frequency**: Every PR  
**Time**: 5-10 minutes

#### Steps

1. **Clone PR branch**:
   ```bash
   git fetch origin pull/<PR#>/head:pr-<PR#>
   git checkout pr-<PR#>
   ```

2. **Run comprehensive checks**:
   ```bash
   # Pre-deployment validation
   ./scripts/pre-deployment-check.sh
   
   # Environment evaluation
   ./scripts/evaluate-environment.sh
   ```

3. **Verify configuration builds**:
   ```bash
   # Test build without switching
   sudo nixos-rebuild dry-build --flake .#BearsiMac
   # Or test specific config
   nix build .#nixosConfigurations.willowie.config.system.build.toplevel
   ```

4. **Check for new user content**:
   ```bash
   git diff main...HEAD --name-only | while read file; do
     if [[ "$file" =~ home/|\.bash_history|\.ssh/id_ ]]; then
       echo "WARNING: User content detected: $file"
     fi
   done
   ```

5. **Verify no secrets added**:
   ```bash
   git diff main...HEAD | grep -iE "(password|secret|token|key)" | grep -v "^[+-]#"
   ```

#### Expected Results
- All validation scripts pass
- Configuration builds successfully
- No user content in diff
- No secrets in diff

#### Failure Actions
- **Build fails**: Request changes to fix
- **User content**: Request removal
- **Secrets**: Request removal and rotation
- **Validation fails**: Request fixes

---

### Procedure 3: Post-Deployment Validation

**When**: After deploying to a system  
**Frequency**: Every deployment  
**Time**: 5-10 minutes

#### Steps

1. **Verify system state**:
   ```bash
   # Check NixOS version
   nixos-version
   
   # Verify configuration path
   readlink /run/current-system
   ```

2. **Check for user data**:
   ```bash
   # List /home contents
   sudo ls -la /home/
   
   # Count files in /home (should be minimal)
   sudo find /home -type f 2>/dev/null | wc -l
   
   # Check for user-specific files
   sudo find /home -name ".*history" -o -name ".ssh" -o -name "Documents" 2>/dev/null
   ```

3. **Verify flake-managed**:
   ```bash
   cd /etc/nixos
   
   # Verify flake exists
   test -f flake.nix && echo "✓ Flake-managed" || echo "✗ Not flake-managed"
   
   # Check for non-flake files
   ls -la | grep -E "configuration.nix$|hardware-configuration.nix$"
   ```

4. **Check services**:
   ```bash
   # List failed services
   systemctl --failed
   
   # Check SOMA services (if applicable)
   systemctl status soma-* | grep "Active:"
   ```

5. **Verify reproducibility**:
   ```bash
   # Test rebuild
   sudo nixos-rebuild dry-build --flake /etc/nixos#$(hostname)
   ```

#### Expected Results
- /home is empty or contains only system users
- System is flake-managed
- No failed services
- Rebuild succeeds

#### Failure Actions
- **User data found**: Investigate and remove
- **Not flake-managed**: Convert to flake
- **Services failed**: Check logs, fix configuration
- **Rebuild fails**: Fix configuration issues

---

### Procedure 4: Secrets Audit

**When**: Monthly, or after security concerns  
**Frequency**: Monthly minimum  
**Time**: 15-20 minutes

#### Steps

1. **Scan git history**:
   ```bash
   # Search entire history for secret patterns
   git log -p | grep -iE "(password|passwd|secret|api.?key|token|private.?key)" | head -50
   ```

2. **Check tracked files**:
   ```bash
   # List all tracked files
   git ls-files
   
   # Check for secret-like filenames
   git ls-files | grep -iE "(secret|\.key$|\.pem$|id_rsa|credential)"
   ```

3. **Verify secrets directory**:
   ```bash
   # Check secrets/.gitignore exists
   test -f secrets/.gitignore && echo "✓ .gitignore exists" || echo "✗ Missing .gitignore"
   
   # Verify no secrets tracked
   git ls-files secrets/ | grep -v "README\|\.gitignore"
   ```

4. **Scan current files**:
   ```bash
   # Run secret scanner
   ./scripts/pre-deployment-check.sh | grep -A 10 "Checking for Accidentally Tracked Secrets"
   ```

5. **Document findings**:
   ```bash
   # Create audit report
   cat > /tmp/secrets-audit-$(date +%Y%m%d).txt <<EOF
   Secrets Audit Report
   Date: $(date)
   Repository: $(git remote get-url origin)
   Branch: $(git branch --show-current)
   
   Findings:
   [Document any issues found]
   
   Actions Taken:
   [Document remediation steps]
   
   Status: [PASS/FAIL]
   EOF
   ```

#### Expected Results
- No secrets in git history
- No secret files tracked
- secrets/ directory properly configured
- No current secret leaks

#### Failure Actions
- **Secrets found**: Immediately rotate credentials
- **Remove from history**: Use git-filter-branch or BFG Repo-Cleaner
- **Update .gitignore**: Prevent future commits
- **Document incident**: Create security report

---

### Procedure 5: Image Export Validation

**When**: Before creating deployment images  
**Frequency**: As needed, before distributions  
**Time**: 20-30 minutes

#### Steps

1. **Pre-export validation**:
   ```bash
   # Run all validation
   ./scripts/pre-deployment-check.sh
   ./scripts/evaluate-environment.sh
   ```

2. **Build image**:
   ```bash
   # Install nixos-generators if needed
   nix-shell -p nixos-generators
   
   # Build ISO image
   nixos-generate -f iso --flake .#BearsiMac -o ./result-iso
   
   # Build VM image
   nixos-generate -f vm --flake .#BearsiMac -o ./result-vm
   ```

3. **Test image in VM**:
   ```bash
   # Boot VM from generated image
   ./result-vm/bin/run-*-vm
   ```

4. **Validate VM environment**:
   ```bash
   # Inside VM
   
   # Check for user data
   ls -la /home
   
   # Verify configuration
   nixos-version
   readlink /run/current-system
   
   # Check services
   systemctl status
   ```

5. **Clean up**:
   ```bash
   # Remove test artifacts
   rm -rf result-*
   
   # Verify no artifacts committed
   git status
   ```

#### Expected Results
- Image builds successfully
- VM boots correctly
- No user data in image
- All services start
- Configuration is identical to source

#### Failure Actions
- **Build fails**: Fix configuration errors
- **VM fails to boot**: Check bootloader configuration
- **User data found**: Investigate source, clean configuration
- **Services fail**: Fix service definitions

---

## Continuous Monitoring

### Daily Checks
- [ ] No new commits with user data
- [ ] No secrets committed
- [ ] Pre-deployment checks pass on main branch

### Weekly Checks
- [ ] All configurations build successfully
- [ ] No warnings in validation scripts
- [ ] Documentation is up to date

### Monthly Checks
- [ ] Secrets audit completed
- [ ] Image export tested
- [ ] Full deployment tested in clean environment
- [ ] Review and update this runbook

## Metrics and KPIs

### Deployment Cleanliness Score

Calculate monthly:

```
Score = (Passed Checks / Total Checks) × 100

Where:
- Passed Checks = checks that returned ✓
- Total Checks = all validation checks run
```

**Target**: ≥ 95%

### Secret Leak Count

Track monthly:
- Number of secrets found in scans
- Number of secrets rotated
- Time to detect and remediate

**Target**: 0 secrets leaked

### Rebuild Success Rate

Track weekly:
- Number of successful rebuilds
- Number of failed rebuilds
- Average build time

**Target**: 100% success rate

## Remediation Templates

### Template: User Data Found

```markdown
## Issue: User Data Detected

**Date**: YYYY-MM-DD
**Detected By**: [Name/Script]
**Location**: [path/to/file]

### Description
User data was found in: [describe]

### Actions Taken
1. Removed file from repository
2. Updated .gitignore to prevent future commits
3. Verified no other user data present
4. Re-ran validation: [PASS/FAIL]

### Prevention
- Added pattern to .gitignore: [pattern]
- Updated documentation
- Team notified
```

### Template: Secret Leaked

```markdown
## SECURITY INCIDENT: Secret Leaked

**Date**: YYYY-MM-DD
**Severity**: HIGH
**Secret Type**: [API key/Password/Token]
**Detected By**: [Name/Script]

### Immediate Actions
1. ✅ Secret rotated/revoked
2. ✅ Removed from git history
3. ✅ Updated .gitignore
4. ✅ All deployments updated

### Investigation
- How it happened: [describe]
- Duration exposed: [time]
- Potential impact: [describe]

### Prevention
- Process updated: [describe]
- Training completed: [date]
- Monitoring enhanced: [describe]
```

## References

- [Clean-Room Deployment Runbook](CLEAN-ROOM-DEPLOYMENT.md)
- [Pre-Deployment Check Script](../../scripts/pre-deployment-check.sh)
- [Secrets Management](../../secrets/README.md)
- [NixOS Deployment Best Practices](https://nixos.wiki/wiki/Deployment)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Review Schedule**: Quarterly  
**Next Review**: 2026-05-02
