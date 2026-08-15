/**
 * PULSE Network Discovery Specification
 *
 * This module defines WHAT the Android app must discover and HOW to do it.
 * Every manual step we've done in terminals is encoded here so it never needs
 * to be repeated manually again.
 *
 * Architecture:
 *   Android app discovers → writes live_registry.json via POST /registry/update
 *   PULSE server.py reads live_registry.json on startup
 *   Result: server always knows the real network topology
 *
 * Discovery pipeline (must run in this order):
 *   1. ARP scan   → get all IPs + MACs on 192.168.86.0/24
 *   2. OUI lookup → vendor from MAC prefix (first 3 bytes)
 *   3. mDNS browse → _raop._tcp (AirPlay), _googlecast._tcp (Cast), _sonos._tcp
 *   4. Port probe  → confirm live devices by protocol
 *   5. Write       → POST confirmed results to PULSE server /registry/update
 */

// ── Discovery sources ─────────────────────────────────────────────────────────

export const MDNS_SERVICE_TYPES = [
  '_raop._tcp.local.',       // AirPlay / AirPlay 2 (Apple TV, Samsung TV, etc.)
  '_airplay._tcp.local.',    // AirPlay 2 service record
  '_googlecast._tcp.local.', // Google Cast / Chromecast (Polk, Nest, Chromecast)
  '_sonos._tcp.local.',      // Sonos LAN API
  '_spotify-connect._tcp.local.', // Spotify Connect (B&O BeoPlay, etc.)
] as const;

// ── Known devices — seeded from manual network audit 2026-03-31 ───────────────
// Android app should UPDATE the ip/mac fields via discovery, not trust these forever.
// confidence levels: "confirmed" | "raop_mdns_confirmed" | "live_unconfirmed" | "needs_discovery"

export interface DiscoveredDevice {
  id: string;
  name: string;
  zone: string;
  ip: string | null;
  mac: string | null;
  vendor: string;
  protocols: string[];
  status: 'seated' | 'live_unconfirmed' | 'needs_discovery' | 'needs_wifi_rejoin' | 'offline';
  confidence: string;
  raop_name?: string;
  pulse_port?: number;
}

export const KNOWN_DEVICES: DiscoveredDevice[] = [
  {
    id: 'pulse:end-room:sonos-five',
    name: 'OBI-WAN (Sonos Five)',
    zone: 'indoor.end_room',
    ip: '192.168.86.44',
    mac: '00:0e:58:8f:9d:06',
    vendor: 'Sonos',
    protocols: ['sonos_s1_lan_api'],
    pulse_port: 1400,
    status: 'seated',
    confidence: 'confirmed — verified via Sonos SOAP /status 2026-03-31',
  },
  {
    id: 'pulse:end-room:polk-magnifi',
    name: 'Polk Magnifi Soundbar',
    zone: 'indoor.end_room',
    ip: '192.168.86.248',
    mac: '88:d0:39:0d:08:a6',
    vendor: 'Polk Audio',
    protocols: ['google_cast'],
    pulse_port: 8009,
    status: 'seated',
    confidence: 'confirmed — verified via Google Cast protocol 2026-03-31',
  },
  {
    id: 'pulse:family-room:apple-tv',
    name: 'Apple TV (Family Room)',
    zone: 'indoor.family_room',
    ip: '192.168.86.36',
    mac: 'f0:f6:c1:11:ab:5e',
    vendor: 'Google/Apple',
    protocols: ['airplay2', 'raop'],
    raop_name: 'Family Room',
    status: 'live_unconfirmed',
    confidence: 'raop_mdns_confirmed — needs protocol handshake to verify AirPlay 2',
  },
  {
    id: 'pulse:end-room:apple-tv',
    name: 'Apple TV (End Room)',
    zone: 'indoor.end_room',
    ip: '192.168.86.26',
    mac: 'dc:56:e7:42:4d:4f',
    vendor: 'Samsung/Apple',
    protocols: ['airplay2', 'raop'],
    raop_name: 'End Room',
    status: 'live_unconfirmed',
    confidence: 'raop_mdns_confirmed — RAOP MAC 72:de:c9:40:2e:06 is 1 byte from ARP entry; needs physical confirm',
  },
  {
    id: 'pulse:end-room:samsung-m50c',
    name: 'Samsung Smart Monitor M50C',
    zone: 'indoor.end_room',
    ip: '192.168.86.34',
    mac: 'a0:d7:f3:ab:72:38',
    vendor: 'Samsung',
    protocols: ['airplay2', 'eshare_cast'],
    status: 'live_unconfirmed',
    confidence: 'BT MAC a0:d7:f3:ab:72:39 matches ARP .38 within 1 bit — high confidence',
  },
  {
    id: 'pulse:family-room:sonos-ray',
    name: 'Sonos Ray (Family Room)',
    zone: 'indoor.family_room',
    ip: null,
    mac: null,
    vendor: 'Sonos',
    protocols: ['sonos_lan_api', 'airplay2'],
    pulse_port: 1400,
    status: 'needs_discovery',
    confidence: 'not found in ARP/mDNS scan — may share IP with Apple TV or be powered off',
  },
  {
    id: 'pulse:den:samsung-tv',
    name: 'Samsung Smart TV (Study/Den)',
    zone: 'indoor.study_den',
    ip: null,
    mac: null,
    vendor: 'Samsung',
    protocols: ['airplay2'],
    status: 'needs_discovery',
    confidence: 'Den iMac at .20 confirmed but TV IP unknown',
  },
  {
    id: 'pulse:end-room:beoplay-a8',
    name: 'B&O BeoPlay A8',
    zone: 'indoor.end_room',
    ip: null,
    mac: null,
    vendor: 'Bang & Olufsen',
    protocols: ['airplay', 'spotify_connect'],
    status: 'needs_wifi_rejoin',
    confidence: 'operator memory — needs physical WiFi reconnect before it appears in scan',
  },
];

// ── What the Android discovery module MUST implement ─────────────────────────
//
// Step 1: ARP scan
//   - Ping sweep 192.168.86.1–254 (parallel, 3s timeout each)
//   - Read ARP cache after sweep: /proc/net/arp (Android) or use NetworkInterface
//   - Result: Map<ip, mac>
//
// Step 2: OUI vendor lookup
//   - Bundle OUI table (first 3 bytes of MAC → vendor name)
//   - Required vendors: Apple (a4:c3, 8c:85, f4:f1, dc:56, 00:17, 58:7f, b0:95, etc.)
//                       Sonos (00:0e:58), Google (f0:f6:c1, 54:60:09, b8:27:eb, 1c:f2:9a, etc.)
//                       Samsung (a0:d7:f3, dc:56:e7, etc.)
//                       Bang & Olufsen (00:1d:98, etc.)
//   - Result: annotated Map<ip, {mac, vendor}>
//
// Step 3: mDNS browse
//   - Browse each MDNS_SERVICE_TYPES entry
//   - Parse service name, hostname, IP, port, TXT records
//   - For _raop._tcp: service name format is MAC@Name (strip MAC, extract name)
//   - For _googlecast._tcp: TXT record contains fn= (friendly name), md= (model)
//   - For _sonos._tcp: TXT record contains roomName=
//   - Result: Map<ip, {raop_name?, cast_name?, sonos_room?, protocols[]}>
//
// Step 4: Protocol probe (confirm seated devices)
//   - Sonos: GET http://{ip}:1400/xml/device_description.xml → parse roomName
//   - Google Cast: TCP connect to port 8009 → TLS + Cast protocol handshake → confirm
//   - AirPlay 2: TCP connect to RAOP port (5000 usually) → OPTIONS * → confirm
//
// Step 5: Write results back to PULSE server
//   - POST http://{PULSE_SERVER}/registry/update
//   - Body: { devices: DiscoveredDevice[] }
//   - Server writes to devices/live_registry.json and reloads endpoints
//   - App shows which devices are SEATED (confirmed) vs UNKNOWN
//
// ── Notes on this house (Susan's Mount Eliza) ────────────────────────────────
//   - Subnet: 192.168.86.0/24 (Google Nest WiFi router)
//   - Double brick walls between main house zones — BLE attenuates significantly
//   - End Room is timber-frame extension — good BLE propagation
//   - Cathedral ceiling (Family Room) — audio reflection considerations
//   - Den iMac (192.168.86.20) is present but NOT a PULSE server — old hardcoded target, now removed
//   - Google Nest Hub/Mini devices (.25, .27, .32) are on network — not yet mapped to rooms

export function getDeviceById(id: string): DiscoveredDevice | undefined {
  return KNOWN_DEVICES.find(d => d.id === id);
}

export function getDevicesByZone(zone: string): DiscoveredDevice[] {
  return KNOWN_DEVICES.filter(d => d.zone === zone);
}

export function getSeatedDevices(): DiscoveredDevice[] {
  return KNOWN_DEVICES.filter(d => d.status === 'seated');
}

export function getDevicesNeedingDiscovery(): DiscoveredDevice[] {
  return KNOWN_DEVICES.filter(d =>
    d.status === 'needs_discovery' || d.status === 'live_unconfirmed'
  );
}
