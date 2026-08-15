# PULSE-Android — AI Handoff Document
<!--
Used by: Claude Code, Gemini, Cursor, ChatGPT
Rule: The AI that ends a session MUST update this file before closing.
Rule: The AI that starts a session MUST read this file before touching any code.
-->

**Project:** PULSE-Android (React Native)
**Last updated:** 2026-04-05
**Updated by:** Claude Code
**Session type:** state update + feature recap

---

## 🔴 READ THIS FIRST — Current Blockers

- [ ] **Background execution** — BLE scanning currently stops when app backgrounded; needs foreground service for true "scout" behaviour.
- [ ] **Write access to server** — Discovery works (Zeroconf), but `POST /devices` telemetry pipeline needs to be activated in `App.tsx`.
- [ ] **Z-axis/Level Logic** — Spatial map is 2D; needs to handle the 5-step drops between levels at Mount Eliza (Study → Lounge, Kitchen → Family).

---

## ✅ What's Already Built (as of 2026-04-05)

### 1. Real Sensor Integration
- **BLE**: Integrated `react-native-ble-plx`. Real scanning active. Tracks RSSI, MAC, and manufacturer data.
- **GPS**: Real-time high-accuracy tracking via `react-native-geolocation-service` with ± accuracy badges.
- **WiFi**: `react-native-zeroconf` integrated. Automatically discovers `_pulse._tcp.` (PULSE server) on the LAN.

### 2. Metatron Translation & Logic
- **Identity Engine**: `metatronTranslate` maps raw BLE packets to alignment tiers (aligned / partial / unaligned).
- **Action Vectors**: `executeAction` handles logic for `Connect`, `Observe`, `Log`, and `Seek-Alignment` based on device identity.
- **BT SIG Registry**: Comprehensive database of manufacturer IDs for hardware identification.

### 3. Spatial Architecture
- **Geometric Topology**: Full 36-zone polygon map of the Mount Eliza estate (`ZoneGeometry.ts`).
- **SpatialRenderer**: SVG-based renderer with support for "Veneers" (Flat Plan) and "Layers".
- **Infrastructure Layers**: Electrical and Plumbing layers mapped with node coordinates for utility tracking.

### 4. Sovereign Registry (`deviceRegistry.ts`)
- **Mount Eliza Taxonomy**: Detailed zone classification (Indoor, Outbuild, Garden, Utility).
- **System Records**: Registry of fixed assets (SOFAR Solar 21kVA, Ducted Heating, Apple TVs, Sonos/B&O Audio).
- **Persistence**: `AsyncStorage` backed device logs and observation history.

### 5. Fidelity Ceremony
- **Calibration UI**: Immersive, aesthetic UI for audio node sync.
- **Protocol**: Interfaces with PULSE server `/calibration` endpoints to sweep frequencies and measure latency.

---

## 🔧 What Still Needs Building (Priority Order)

1. **Active Telemetry Pipeline**
   - Wire `executeAction` results and GPS/WiFi snapshots to `POST ${serverUrl}/telemetry`.
   - Implement local buffering (Murmuration Protocol) for offline state.

2. **Foreground Service / Persistence**
   - Ensure BLE scanning remains active when the screen is off (crucial for "scout" role).
   - Use `react-native-foreground-service` or similar.

3. **Spatial Device Pinning**
   - Render discovered BLE devices as pins on the `SpatialRenderer` map based on trilateration or zone-assignment.
   - Implement "Drag to Seat" UI to manually assign unaligned devices to zones.

4. **Utility Monitoring**
   - Solar: Integrate `pysolarmanv5` bridge (or similar) to pull live data from the SOFAR inverter.
   - Gas: Pulse counter integration for the Landis+Gyr meter.

---

## 🧠 Decisions Made

- **Sovereignty First**: All discovery (mDNS, BLE, SSDP) must be local/LAN. No reliance on manufacturer clouds (Samsung, B&O, etc).
- **Metatron is the Filter**: No raw BLE data hits the UI without passing through the translation layer first.
- **Android is the Hub**: iOS is relegated to a "Remote" role; Android (S22) is the primary "Scout" due to permissive background sensor access.

---

## 🗺️ Project State Snapshot

| Layer | Status | Notes |
|-------|--------|-------|
| UI / Symbology | ✅ Complete | Void aesthetic, Metatron tiers |
| BLE scanning | ✅ Real | `react-native-ble-plx` |
| WiFi discovery | ✅ Real | Zeroconf / mDNS |
| Spatial Map | ✅ Detailed | 36 zones, Elec/Plumb layers |
| Server Connection | 🟡 Partial | Discovery + Ping OK; Telemetry pending |
| Murmuration Sync | ❌ Not started | Local buffer + sync logic |

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main orchestrator & sensor loop |
| `src/deviceRegistry.ts` | The "Source of Truth" for the house |
| `src/metatronBleTranslate.ts` | The intelligence layer for BLE |
| `src/spatial/SpatialRenderer.tsx` | Map engine |
| `src/executeAction.ts` | Invariant execution logic |

---

## 🌐 Environment & Connections

| Resource | Value | Notes |
|----------|-------|-------|
| PULSE server | `_pulse._tcp.` | Discovered via Zeroconf (usually 192.168.86.39:9000) |
| Target Device | Samsung S22 | Main test bench |
| Solar Inverter | SOFAR 21kVA | 3-phase, battery-ready, north wall |
| AV Hub | Apple TV 4K | End Room (Timber frame = low attenuation) |
