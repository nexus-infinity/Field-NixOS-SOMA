# Secrets Management

⚠️ **WARNING: This directory should NEVER be committed to Git!**

## Purpose

This directory is for local secrets management during development and deployment. It exists to:
- Provide a clear location for secrets separate from configuration
- Enable `.gitignore` to explicitly exclude this entire directory
- Support various secrets management tools (sops-nix, agenix, etc.)

## What Belongs Here

- Encrypted secrets files (e.g., `secrets.yaml` for sops-nix)
- Age/GPG keys for secret decryption
- API tokens and credentials (encrypted)
- SSH keys (encrypted)
- TLS certificates and private keys (encrypted)

## What Does NOT Belong Here

- **Plaintext secrets** (use encryption!)
- **Personal user data** (this is infrastructure only)
- **Source code** (belongs in appropriate module directories)
- **Configuration** (belongs in declarative NixOS configs)

## Recommended Tools

### sops-nix (Recommended)
```nix
# In your configuration
imports = [ ./modules/secrets-management.nix ];

sops = {
  defaultSopsFile = ./secrets/secrets.yaml;
  age.keyFile = "/var/lib/sops-nix/key.txt";
  secrets.example-secret = {};
};
```

### agenix
```nix
age.secrets.example-secret = {
  file = ./secrets/example-secret.age;
};
```

## Directory Structure

```
secrets/
├── README.md                 # This file (only thing committed)
├── .gitignore                # Ensures nothing else is committed
├── secrets.yaml              # Encrypted secrets (sops-nix)
├── .sops.yaml                # Sops configuration
└── keys/                     # Encryption keys (NEVER COMMIT)
    └── .gitkeep              # (only to create directory)
```

## Setup for New Deployments

1. **Install secrets management tool**:
   ```bash
   nix-shell -p sops --run "sops --version"
   ```

2. **Initialize secrets file**:
   ```bash
   # Generate age key
   nix-shell -p age --run "age-keygen -o secrets/keys/age-key.txt"
   
   # Create sops configuration
   cat > secrets/.sops.yaml <<EOF
   keys:
     - &admin_key YOUR_AGE_PUBLIC_KEY
   creation_rules:
     - path_regex: secrets.yaml$
       key_groups:
         - age:
             - *admin_key
   EOF
   
   # Create and edit secrets
   sops secrets/secrets.yaml
   ```

3. **Use secrets in configuration**:
   ```nix
   sops.secrets.example = {
     sopsFile = ./secrets/secrets.yaml;
   };
   ```

## Deployment Validation

Before deploying:
1. ✅ Verify secrets are encrypted (never plaintext)
2. ✅ Check `.gitignore` excludes all secret files
3. ✅ Confirm no secrets in git history: `git log -p | grep -i "password\|token\|key"`
4. ✅ Use `scripts/pre-deployment-check.sh` to scan for leaks

## Stateless Deployment Principle

- **Secrets are NOT part of the configuration**
- **Secrets are injected at deployment time**
- **Each environment has its own secrets**
- **Secrets should be stored in secure vaults** (not in git)
- **CI/CD pipelines should use secret management systems** (GitHub Secrets, Vault, etc.)

## Emergency: Secret Leaked

If a secret is accidentally committed:

1. **Immediately rotate the secret** (revoke and create new)
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch secrets/leaked-file' \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team)
4. **Update all deployments** with new secrets

## Additional Resources

- [sops-nix documentation](https://github.com/Mic92/sops-nix)
- [agenix documentation](https://github.com/ryantm/agenix)
- [NixOS secrets management](https://nixos.wiki/wiki/Comparison_of_secret_managing_schemes)
