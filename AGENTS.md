# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

**iNixOS-Willowie / FIELD-NixOS-SOMA** is a NixOS flake monorepo (not a typical Node/Python app repo). It defines four machine configurations (`BearsiMac`, `willowie`, `soma-willowie`, `trident-dev`), SOMA chakra services, Python orchestration scripts, and the Atlas Next.js dashboard.

Primary tooling: **Nix flakes**. Avoid Docker-first workflows; see `copilot-instructions.md`.

## Cursor Cloud specific instructions

### Nix (required for flake validation)

Nix is installed single-user on the VM. Each new shell must load it:

```bash
. /home/ubuntu/.nix-profile/etc/profile.d/nix.sh
```

Flakes are enabled via `~/.config/nix/nix.conf` (`experimental-features = nix-command flakes`).

Common commands (from repo root):

```bash
nix flake show
./scripts/pre-deployment-check.sh
./scripts/evaluate-environment.sh
nix develop .#default    # or .#soma, .#trident
```

Full `nixos-rebuild switch` requires bare metal/VM with real hardware config. In cloud VMs, CI-style evaluation is enough:

```bash
nix eval .#nixosConfigurations.willowie.config.system.build.toplevel.drvPath
```

(`boot.loader.grub.devices` may fail on stub hardware — expected outside NixOS targets.)

### Atlas frontend (Next.js dashboard)

```bash
cd dot-hive/atlas-frontend
npm install
npm install tw-animate-css   # required by app/globals.css but missing from package.json
npx next dev -p 3000 --webpack
```

Open http://localhost:3000 — shows the chakra octahedron UI (ATLAS header, coherence %, OBSERVER mode).

**Gotcha:** Default Turbopack (`next dev`) fails to resolve `@import "tw-animate-css"` in `app/globals.css`. Use `--webpack` until the import or dependency is fixed upstream.

`npm run lint` is broken on Next.js 16 (invokes invalid `lint` directory). Use `npm run build` with `--webpack` if you need a production check.

### SOMA MCP bridge (Python service)

```bash
pip install fastapi uvicorn pydantic httpx
export PATH="$HOME/.local/bin:$PATH"
python3 services/mcp/soma_mcp_bridge.py
```

Health: `curl http://localhost:8520/health`  
Tools: `curl http://localhost:8520/mcp/tools`  
Call: `curl -X POST http://localhost:8520/mcp/call -H 'Content-Type: application/json' -d '{"name":"soma_ubuntu_check","arguments":{"detailed":true}}'`

Chakra agent endpoints are stubs unless the full SOMA stack is running.

### Trident Scrum (Python tests)

Requires `python3-venv` on Debian/Ubuntu hosts (`apt install python3.12-venv` once per VM image).

```bash
cd trident_scrum
python3 -m venv venv
./venv/bin/pip install pytest pytest-cov dataclasses-json pyyaml
./venv/bin/python -m pytest tests/ -q
```

### DNA / SOMA validation

```bash
./scripts/validate_all_dna.sh
```

### Running services in background

Use tmux (`tmux -f /exec-daemon/tmux.portal.conf`) for long-running dev servers (Atlas on 3000, MCP bridge on 8520).

### What not to expect in cloud VMs

- Full NixOS `nixos-rebuild switch` on iMac hardware profiles
- Redis/PostgreSQL chakra agents without `soma-willowie` infrastructure
- Atlas live MQTT (frontend uses mock chakra data today)
