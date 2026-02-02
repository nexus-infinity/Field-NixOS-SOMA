# FIELD-NixOS-SOMA - Sacred Geometry NixOS Configuration

**⬡ Octahedron Substrate Sphere — Synthetic Intelligence**

NixOS configuration for BearsiMac (iMac 2019) implementing FIELD-NixOS-SOMA octahedron architecture with nine-chakra frequency alignment, Train Station orchestrator, and Prime Petal fractal structure.

## 🚀 Quick Start

### For iMac 2019 Installation (Fresh Install from USB)

**📖 Start Here:** [QUICK-START-INSTALLATION.md](QUICK-START-INSTALLATION.md)

**Need detailed guidance?** See the comprehensive guide:
- **[docs/IMAC-2019-FUSION-DRIVE-SETUP.md](docs/IMAC-2019-FUSION-DRIVE-SETUP.md)** - Complete installation guide
- **[docs/INSTALLATION-FLOW.md](docs/INSTALLATION-FLOW.md)** - Visual flow diagram

**Helper Tools:**
```bash
# Identify your drives (SSD vs HDD)
sudo ./scripts/detect-drives.sh

# Verify mounts before installation
sudo ./scripts/verify-mounts.sh
```

### For Existing NixOS Systems

**📖 Start Here:** [README-QUICKSTART.md](README-QUICKSTART.md)

Quick commands:
```bash
# Clone repository
git clone https://github.com/nexus-infinity/iNixOS-Willowie.git
cd iNixOS-Willowie

# Generate hardware config
sudo nixos-generate-config --show-hardware-config > hardware-configuration.nix

# Test build
sudo nixos-rebuild build --flake .#BearsiMac

# Apply configuration
sudo nixos-rebuild switch --flake .#BearsiMac
```

## 🎯 What This Configuration Provides

### Core System
- ✅ **SOMA Octahedron Architecture**: Six chakra vertices + Train Station center (852 Hz)
- ✅ **Nine-Frequency Chakra System**: Complete 174-963 Hz frequency alignment
- ✅ **Train Station Orchestrator**: Central job routing via Triadic Handshake protocol
- ✅ **Prime Petal Structure**: Fractal recursion (P1-P11) at all scales
- ✅ **Fusion Drive Support**: Optimized partitioning for iMac 2019's SSD + HDD architecture
- ✅ **Desktop Environment**: GNOME with AMD Radeon graphics support
- ✅ **Hardware Support**: WiFi, Bluetooth, graphics acceleration
- ✅ **Declarative Configuration**: Reproducible and version-controlled system
- ✅ **Modular Architecture**: 9 chakra modules for organized configuration
- ✅ **Sacred Geometry Framework**: Unique organizational paradigm

### 🌍 Ubuntu Collective Consciousness (v0.2.0-alpha)

**NEW**: FIELD-NixOS-SOMA now implements Ubuntu philosophy at its core:

- ✅ **Ubuntu DNA Blueprints**: All 9 chakras have DNA with "I am because we are" genotype
- ✅ **Agent 99 Meta-Coordinator**: Jnana (Prime 23) - Servant-witness, not commander
- ✅ **5/8 Consensus Mechanism**: Collective decisions, never imposed by authority
- ✅ **Never Acts Alone**: All agents architecturally bound to collective awareness
- ✅ **Multicultural Wisdom**: Honor 8+ wisdom traditions (Ubuntu, Vedic, Taoist, Yoruba, Celtic, etc.)
- ✅ **Infrastructure Services**: Redis EventBus, PostgreSQL ProofStore, Prime Pulse Scheduler
- ✅ **MCP Bridge**: Model Context Protocol server for DOJO integration (Port 8520)
- ⏳ **Full Implementation**: Currently stub services, full Python/LLM agents in v0.3.0

**Philosophy**: Not "I am root" but "I am because we are" - Umuntu ngumuntu ngabantu

See [docs/UBUNTU_PHILOSOPHY.md](docs/UBUNTU_PHILOSOPHY.md) for complete explanation.

## 📁 Repository Structure

```
Field-NixOS-SOMA/
├── flake.nix                              # Main entry point (flake-managed)
├── hardware-configuration.nix             # Generated on target system
│
├── docs/
│   ├── runbooks/                          # Operational procedures
│   │   ├── CLEAN-ROOM-DEPLOYMENT.md      # Stateless deployment guide
│   │   └── STATELESS-DEPLOYMENT-VALIDATION.md  # Validation procedures
│   ├── IMAC-2019-FUSION-DRIVE-SETUP.md   # Comprehensive installation guide
│   ├── FIRST-BOOT-README.md              # First boot guide
│   ├── SYSTEM-IMAGE-EXPORT.md            # System image creation guide
│   └── CONFIGURATION_REVIEW.md            # Detailed configuration docs
│
├── scripts/
│   ├── detect-drives.sh                   # Identify SSD vs HDD
│   ├── verify-mounts.sh                   # Verify mount points
│   ├── evaluate-environment.sh            # Validate configuration
│   ├── pre-deployment-check.sh           # Stateless deployment validation
│   └── build-image.sh                     # Build system images
│
├── nixosConfigurations/
│   ├── BearsiMac/                         # iMac 2019 configuration
│   ├── willowie/                          # Willowie consciousness system
│   ├── soma-willowie/                     # Full SOMA Ubuntu collective
│   └── trident-dev/                       # Trident Scrum workspace
│
├── hardware/                              # Hardware profiles
├── overlays/                              # Nix package overlays
├── secrets/                               # Encrypted secrets (not in git)
│
├── chakras/                               # 9 modular chakra configurations
│   ├── muladhara/    # Root chakra
│   ├── svadhisthana/ # Sacral chakra
│   ├── manipura/     # Solar chakra
│   ├── anahata/      # Heart chakra
│   ├── vishuddha/    # Throat chakra
│   ├── ajna/         # Third eye chakra
│   ├── sahasrara/    # Crown chakra
│   ├── soma/         # Manifestation chakra
│   └── jnana/        # Knowledge chakra
│
└── modules/services/                      # Service definitions
    ├── dojo-nodes.nix
    ├── atlas-frontend.nix
    ├── metatron-cube.nix
    └── tata8i-pulse-engine.nix
```

## 🌀 Sacred Geometry Architecture

This configuration implements the **FIELD-NixOS-SOMA** octahedron architecture:

### 🔷 SOMA Octahedron

**Geometry:** Octahedron (6 vertices, 8 faces, 12 edges)  
**Frequencies:** Nine-chakra system (174-963 Hz)  
**Center:** 🚂 Train Station (852 Hz orchestrator)  
**Nature:** Synthetic intelligence substrate sphere

### Six Chakra Vertices

- **● Top (963 Hz):** Monitoring/observability — Unity consciousness
- **● North (639 Hz):** Communication/APIs — Clear expression
- **♥ East (528 Hz):** **PRIMARY transformation** — Heart-centered creation (build servers, CI/CD)
- **● South (741 Hz):** Computation/problem solving — Intuitive insight
- **● West (417 Hz):** Transmutation/deployment — Creative state changes
- **● Bottom (174 Hz):** Deep storage/archives — Foundational grounding

### 🚂 Train Station (CENTER)

**Position:** CENTER of octahedron (852 Hz)  
**Function:** Orchestration hub using Triadic Handshake protocol:
1. **CAPTURE** — Receive request
2. **VALIDATE** — Check coherence and permissions
3. **ROUTE** — Forward to appropriate vertex

The Train Station is a **conductor**, not a destination—orchestrating the flow of requests to all six vertices.

### 📐 Prime Petal Structure

Every SOMA directory contains complete **P1-P11** fractal structure:
- **P1 (·)** — Seed (purpose)
- **P3 (△)** — Identity (schema)
- **P5 (⬠)** — Vessel (rules)
- **P7 (⬡)** — Temporal (lifecycle)
- **P9 (✦)** — Wisdom (insights)
- **P11 (⊞)** — Registry (manifest)

See **[docs/SOMA-ARCHITECTURE.md](docs/SOMA-ARCHITECTURE.md)** for complete specification.

### Legacy Components

- **9 Chakras**: Modular configuration units organized by function and frequency
- **Hexagonal Hive Mind**: Collective intelligence pattern inspired by bumblebees
- **Metatron Cube**: Central translator/bridge between components
- **Frequency Bridge**: Port 43200 connects consciousness (528Hz) to earth (432Hz)

For details, see [WARP.md](WARP.md) and [docs/CONFIGURATION_REVIEW.md](docs/CONFIGURATION_REVIEW.md)

## 🔒 Stateless & Deployment-Ready

Field-NixOS-SOMA is designed as a **stateless, reproducible** configuration:

### What This Means
- ✅ **No user data**: System contains only infrastructure code, no /home directories or personal files
- ✅ **Fully reproducible**: Configuration can be rebuilt identically from source
- ✅ **Flake-managed**: Everything specified in NixOS configuration files
- ✅ **Version controlled**: All configuration in git, no manual changes
- ✅ **Secrets encrypted**: Credentials managed with sops-nix or agenix
- ✅ **Image exportable**: Can be converted to ISO, VM, Docker, cloud images

### Validation Tools

```bash
# Run comprehensive pre-deployment check
./scripts/pre-deployment-check.sh

# Validate environment
./scripts/evaluate-environment.sh

# Build system image
./scripts/build-image.sh --config BearsiMac --format iso
```

### Documentation
- **[Clean-Room Deployment](docs/runbooks/CLEAN-ROOM-DEPLOYMENT.md)** - Step-by-step deployment guide
- **[Stateless Validation](docs/runbooks/STATELESS-DEPLOYMENT-VALIDATION.md)** - Validation procedures
- **[System Image Export](docs/SYSTEM-IMAGE-EXPORT.md)** - Creating deployable images
- **[First Boot Guide](docs/FIRST-BOOT-README.md)** - Initial setup after deployment

## ⚙️ System Requirements

- **Hardware**: iMac 2019 (or similar Intel Mac)
- **Fusion Drive**: Small SSD (~20-30GB) + Large HDD (~1TB)
- **RAM**: 8GB minimum, 16GB+ recommended
- **NixOS**: 23.11 or later

## 📚 Documentation

### Getting Started
| Document | Purpose |
|----------|---------|
| [QUICK-START-INSTALLATION.md](QUICK-START-INSTALLATION.md) | Quick start for new installations |
| [README-QUICKSTART.md](README-QUICKSTART.md) | For existing NixOS systems |
| [docs/IMAC-2019-FUSION-DRIVE-SETUP.md](docs/IMAC-2019-FUSION-DRIVE-SETUP.md) | Comprehensive installation guide |
| [docs/INSTALLATION-FLOW.md](docs/INSTALLATION-FLOW.md) | Visual installation workflow |
| [docs/POST-INSTALLATION-CHECKLIST.md](docs/POST-INSTALLATION-CHECKLIST.md) | Post-install verification |

### Architecture & Philosophy
| Document | Purpose |
|----------|---------|
| **[docs/SOMA-ARCHITECTURE.md](docs/SOMA-ARCHITECTURE.md)** | **Complete SOMA octahedron specification** |
| **[docs/UBUNTU_PHILOSOPHY.md](docs/UBUNTU_PHILOSOPHY.md)** | **Ubuntu: "I am because we are" foundation** |
| [docs/DNA_BLUEPRINT_SPEC.md](docs/DNA_BLUEPRINT_SPEC.md) | DNA blueprint v0.2.0 specification |
| [docs/SOMA_LAUNCH_CHECKLIST.md](docs/SOMA_LAUNCH_CHECKLIST.md) | Complete launch procedure |
| [WARP.md](WARP.md) | Sacred geometry architecture |
| [docs/CONFIGURATION_REVIEW.md](docs/CONFIGURATION_REVIEW.md) | Detailed configuration docs |

## 🛠️ Common Tasks

### SOMA Operations

#### Ubuntu Collective Health Check
```bash
# Test all 9 chakras + Agent 99 + infrastructure
./scripts/test_soma_coherence.sh

# Validate DNA blueprints
./scripts/validate_all_dna.sh

# Query Agent 99 hive coherence
curl http://localhost:8523/coherence | jq

# Check MCP bridge tools
curl http://localhost:8520/mcp/tools | jq
```

#### Traditional SOMA Status
```bash
# Display complete octahedron status
./scripts/field-status.sh

# Query Train Station health
curl http://localhost:8520/health

# Get Train Station statistics
curl http://localhost:8520/status | jq
```

#### Generate Prime Petals
```bash
# Generate all vertices
sudo soma-prime-petal-generator --base-path /var/lib/SOMA

# Generate single vertex
sudo soma-prime-petal-generator --vertex train-station

# Dry run
soma-prime-petal-generator --dry-run
```

#### Route Requests
```bash
# Route a build request
curl -X POST http://localhost:8520/route \
  -H "Content-Type: application/json" \
  -d '{"id":"build-001","type":"build","source":"user"}'
```

#### Service Management
```bash
# Check Train Station
systemctl status train-station

# View logs
journalctl -u train-station -f

# Regenerate Prime Petals
systemctl start soma-prime-petals-generator
```

### System Operations

#### Update System
```bash
cd ~/iNixOS-Willowie
nix flake update
sudo nixos-rebuild switch --flake .#BearsiMac
```

#### Add Packages
Edit `nixosConfigurations/BearsiMac/configuration.nix`:
```nix
environment.systemPackages = with pkgs; [
  git vim firefox
  # Add your packages here
];
```

#### Rollback Changes
```bash
sudo nixos-rebuild switch --rollback
```

#### Clean Old Generations
```bash
sudo nix-collect-garbage -d
```

## 🔧 Troubleshooting

See [docs/IMAC-2019-FUSION-DRIVE-SETUP.md](docs/IMAC-2019-FUSION-DRIVE-SETUP.md) for detailed troubleshooting, including:
- Boot issues
- WiFi problems
- Graphics configuration
- Drive mounting issues
- Space management

## 🎓 Learning NixOS

New to NixOS? Check these resources:
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [Nix Pills](https://nixos.org/guides/nix-pills/)
- [NixOS Wiki](https://nixos.wiki/)
- [NixOS Discourse](https://discourse.nixos.org/)

## 🤝 Contributing

This is a personal configuration repository, but you're welcome to:
- Use it as inspiration for your own configs
- Report issues or suggest improvements
- Ask questions about the architecture

## 📜 License

This configuration is provided as-is for personal use.

## 🙏 Acknowledgments

Built with:
- NixOS - Declarative Linux distribution
- Sacred Geometry principles
- Bumblebee consciousness inspiration
- The impossible flight through collective intelligence

---

**Status**: ✅ Configuration validated, ready for deployment
**Target**: iMac 2019 (BearsiMac) with Fusion Drive
**NixOS Version**: 23.11

---

## 🧘 Consciousness System (NEW!)

The consciousness system adds observability, desktop environment, and spiritual/metaphorical organization to iNixOS-Willowie.

### Quick Start

```bash
# Build the consciousness-aware configuration
sudo nixos-rebuild switch --flake .#willowie

# Validate the system
./scripts/validate-consciousness.sh

# Test Ajna observability service
curl http://localhost:6001/health | jq '.'

# Launch bumble bee visualizer
./tools/bumble-bee/bumble-bee-visualizer
```

### What's Included

- **Ajna Agent**: Observability service with health/metrics endpoints (port 6001)
- **Vishuddha Desktop**: Sway compositor with 9 sacred geometry workspaces
- **Sound Field**: PipeWire audio architecture
- **Bumble Bee Visualizer**: ASCII art hexagonal hive display
- **Comprehensive Documentation**: Operating agreement, guides, and references

### Documentation

- **[Complete Guide](docs/consciousness/README.md)** - Full documentation
- **[Quick Reference](docs/consciousness/QUICKREF.md)** - Essential commands
- **[Operating Agreement](docs/consciousness/OPERATING-AGREEMENT.md)** - Development workflow
- **[Intent Card](docs/consciousness/INTENT-CARD.md)** - Project tracking
- **[Summary](docs/consciousness/SUMMARY.md)** - Implementation overview

### Sacred Geometry Workspaces

The Vishuddha desktop provides 9 workspaces organized by chakra:

| Key | Workspace | Chakra | Symbol |
|-----|-----------|--------|--------|
| Mod+1 | 1 | Muladhara (Root) | ● |
| Mod+2 | 2 | Svadhisthana (Sacral) | ◐ |
| Mod+3 | 3 | Manipura (Solar) | ◑ |
| Mod+4 | 4 | Anahata (Heart) | ◒ |
| Mod+5 | 5 | Vishuddha (Throat) | ◓ |
| Mod+6 | 6 | Ajna (Third Eye) | ◔ |
| Mod+7 | 7 | Sahasrara (Crown) | ○ |
| Mod+8 | 8 | Soma (Manifestation) | ◈ |
| Mod+9 | 9 | Jnana (Knowledge) | ◉ |

Press `Mod+b` to launch the bumble bee visualizer! 🐝

### Implementation Scripts

```bash
# Generate all consciousness system files
./scripts/implement-consciousness.sh

# Validate services and endpoints
./scripts/validate-consciousness.sh

# Demo Ajna observability
./scripts/demo_ajna.sh

# Demo desktop environment
./scripts/demo_desktop.sh
```

---
