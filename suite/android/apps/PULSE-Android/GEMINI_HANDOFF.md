# PULSE Android — Gemini Handoff
**Date:** 2026-03-28
**From:** Claude Code (session with full FIELD context)
**To:** Gemini (Android Studio)

---

## What This Project Is

PULSE is the sovereign home operating system for the FIELD system. It coordinates all devices in the home network — speakers, sensors, smart devices — without a central master. The metaphor is a murmuration of starlings: no leader, coherence emerges from local geometric rules applied by each device.

The Android app is the **scout** in this flock. Android was chosen over iOS specifically because Android gives full access to:
- BLE scanning (real background scanning, not iOS sandbox)
- WiFi probe requests and network discovery
- mDNS / NSD (Network Service Discovery)
- GPS at high update rates
- Background services that actually stay alive

---

## Repository

`https://github.com/nexus-infinity/PULSE-Android` (private)
Local clone: `/Users/field/FIELD-LIVING/PULSE-Android`

React Native project. The `.idea/` folder means it opens cleanly in Android Studio.

---

## What's Already Built

`App.tsx` has a working scaffold:
- Dark void UI (`#0a0a0a` background)
- Status cards for BLE / WiFi / GPS / Metro
- Heartbeat ticker (proves Metro connection is live)
- Scan button (currently fake — toggles state for 3 seconds)
- Correct PULSE symbology (`◉ PULSE`, `⊕ Scan Environment`)

The app compiles and runs. The Metro bundler works.

---

## What Needs Building (Priority Order)

### 1. Real BLE Scanning
Replace the fake `handleScan` with actual BLE using `react-native-ble-plx`:
- Scan for nearby BLE devices
- Show device names, signal strength (RSSI), UUIDs
- Identify known FIELD devices by UUID prefix

### 2. Real WiFi / Network Discovery
Use `react-native-network-info` + NSD (Android Native Module) to:
- List devices on the local network
- mDNS discovery for PULSE server at `den-imac.lan:9000`
- Show discovered devices with IP + hostname

### 3. Connect to PULSE Server
PULSE server runs at `http://192.168.86.20:9000` (den-imac.lan)
- `GET /` → server status
- Send discovered device list to server for seating
- Receive home topology in return

### 4. HAL Telemetry Pipeline
The architecture spec (Notion: "HAL Specification — Hardware Abstraction Layer") defines:
- Sensors → HAL normalization → Arkadaş (SPIN) → DOJO apex
- Android should send normalized sensor packets (IMU, GPS, WiFi RSSI) to the PULSE server
- Format: `{ device_id, timestamp_ns, sensor_type, data, quality }`

### 5. Murmuration Protocol
When Mac Studio is offline, Android maintains local state and queues.
When back online, syncs to PULSE server.
Protocol defined in Notion: "Murmuration Protocol — Device Coordination"

---

## FIELD System Context (critical for naming and symbology)

| Chamber | Symbol | Frequency | Port | Role |
|---------|--------|-----------|------|------|
| DOJO    | ◼︎     | 741 Hz    | 7410 | Manifestation apex |
| OBI-WAN | ●      | 963 Hz    | 9630 | Observer / Sonos node |
| ATLAS   | ▲      | 528 Hz    | 5280 | Architect / topology |
| TATA    | ▼      | 432 Hz    | 4320 | Temporal truth |
| AKRON   | ◻      | 396 Hz    | 3960 | Archive / sovereignty |
| ARKADAŞ | ◉      | 717 Hz    | 7170 | SPIN / embodiment bridge |
| Kings   | ◎      | 852 Hz    | 8520 | Infrastructure / translation |

**Rule:** PORT = FREQUENCY × 10. Never break this.

**Colour palette** (void / dark UI):
- Void background: `#05050A`
- Surface: `#0F0F1A`
- Border: `#2A2A40`
- Text primary: `#F1F5F9`
- Text muted: `#64748B`
- DOJO violet: `#7C3AED`
- OBI-WAN silver: `#E2E8F0`
- ATLAS cyan: `#06B6D4`
- AKRON earth: `#78716C`
- ARKADAŞ gold: `#EAB308`

**PULSE primitive:** `∿` (oscillation / living signal)

---

## Known Devices on the Network

| Device | IP | Role |
|--------|----|------|
| Mac Studio | 192.168.86.39 | Primary core |
| OBI-WAN (Sonos Play:5) | 192.168.86.44 | Studio speaker |
| Polk Cast (End Room) | 192.168.86.248 | End room speaker |
| PULSE Server (den-imac) | 192.168.86.20:9000 | Home coordinator |

---

## What NOT to Do

- Do not add a central "master" device concept — the murmuration has no leader
- Do not use iOS-style permission flows — lean into Android's open sensor access
- Do not create a separate backend — Android feeds into PULSE server, not its own state store
- Do not use bright colours or cluttered UI — void aesthetic, signals only
- Do not rename chambers or change frequencies — these are canonical and locked

---

## Running the Project

```bash
cd /Users/field/FIELD-LIVING/PULSE-Android
npm install
# Then in Android Studio: Run > Run 'app' with device/emulator connected
# Or from terminal with device connected:
npx react-native run-android
```

Metro bundler starts automatically. If it doesn't:
```bash
npx react-native start
```

---

## Questions to Ask the User

1. Do you have an Android device to test on, or should we use the emulator?
2. Which feature first — BLE scanning or WiFi/network discovery?
3. Should discovered devices show up in a list, or on a visual map of the house topology?
