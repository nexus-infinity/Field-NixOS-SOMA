/**
 * Metatron BLE Translator
 *
 * Applies the 12-point Metatron Cube schema to raw BLE advertisement data,
 * producing a sovereign device profile aligned with FIELD chamber geometry.
 *
 * The 12 dimensions (mirroring the 12 vertices of Metatron's Cube):
 *
 *   1.  Manufacturer       — BT SIG company name
 *   2.  Device name        — advertised or null
 *   3.  Device class       — phone / audio / iot / wearable / printer / display / beacon
 *   4.  Apple subtype      — AirPods / iPhone / Watch / HomePod etc. (Apple only)
 *   5.  Service profile    — roles inferred from service UUIDs
 *   6.  Signal tier        — proximity distance from RSSI
 *   7.  Advertisement mode — connectable vs broadcast-only
 *   8.  Alignment tier     — aligned / partial / unaligned
 *   9.  Chamber affinity   — which FIELD chamber this device resonates with
 *   10. Frequency color    — derived from chamber (not decoration — semantic)
 *   11. Trust vector       — known / partial / unknown
 *   12. Action vector      — observe / connect / log / seek-alignment
 *
 * Local translation runs fully offline.
 * When Kings Chamber is reachable (home network), unresolved devices can be
 * elevated to /synthesize for richer cross-chamber interpretation.
 */

import { FREQ_COLORS } from './theme';
import BT_COMPANY_IDS from './btCompanyIds';
import { atob } from './core/base64';

// ─────────────────────────────────────────────────────────────────────────────
// POINT 4 — Apple Continuity subtype map (manufacturer data byte index 2)
// Source: reverse-engineered Apple Continuity Protocol
// ─────────────────────────────────────────────────────────────────────────────
const APPLE_CONTINUITY_TYPES: Record<number, string> = {
  0x02: 'AirPods (Gen 1)',
  0x05: 'AirDrop · Mac / iPhone / iPad',
  0x07: 'AirPods (Proximity)',
  0x08: 'WiFi Join · iPhone / iPad',
  0x09: 'Instant Hotspot · iPhone',
  0x0A: 'Nearby · iPhone / iPad / Mac',
  0x0B: 'Handoff · Apple Watch',
  0x0C: 'HomeKit Hub',
  0x0D: 'AirPods (Proximity v2)',
  0x0E: 'HomeKit Encrypted',
  0x0F: 'Nearby Info',
  0x10: 'Find My · iPhone / iPad / Mac',
  0x12: 'AirTag / Find My (v2)',
  0x13: 'HomePod',
  0x14: 'Tethering Source · iPhone Hotspot',
  0x15: 'Tethering Target',
  0x27: 'Nearby Device',
  0x43: 'Apple TV / Continuity',
};

// ─────────────────────────────────────────────────────────────────────────────
// POINT 3 — Device class inference rules
// ─────────────────────────────────────────────────────────────────────────────
type DeviceClass =
  | 'phone'
  | 'tablet'
  | 'computer'
  | 'audio'
  | 'wearable'
  | 'iot'
  | 'printer'
  | 'display'
  | 'beacon'
  | 'tv'
  | 'unknown';

const CLASS_FROM_MANUFACTURER_ID: Record<number, DeviceClass> = {
  0x004C: 'phone',       // Apple (refined by subtype)
  0x0075: 'phone',       // Samsung
  0x00E0: 'iot',         // Google
  0x0006: 'computer',    // Microsoft
  0x0025: 'iot',         // Philips (Hue)
  0x0047: 'printer',     // Epson
  0x0310: 'wearable',    // Fitbit
  0x0157: 'wearable',    // Garmin
  0x02E5: 'wearable',    // Polar
  0x038F: 'beacon',      // Tile
  0x0087: 'audio',       // Bose
  0x02FF: 'audio',       // Sony
  0x07D7: 'iot',         // Tuya / Grid Connect
};

const CLASS_FROM_SERVICE_UUID: Record<string, DeviceClass> = {
  '180d': 'wearable',   // Heart Rate
  '110b': 'audio',      // Audio Sink
  '110a': 'audio',      // Audio Source
  '1108': 'audio',      // Headset
  '1812': 'computer',   // HID
  'fe9f': 'tv',         // Google Nest/Cast
  'fec9': 'iot',        // Google Home
  'fd50': 'iot',        // Tuya Smart
  '1910': 'iot',        // Tuya Mesh Network (Globe/Grid Connect provisioning)
  'fff0': 'iot',        // Generic smart device (common Tuya/Globe pattern)
  'ffe0': 'iot',        // Generic smart device (common Tuya/Globe pattern)
  'fecb': 'beacon',     // Tile
  'feaa': 'beacon',     // Eddystone
  'fe95': 'iot',        // Xiaomi / Mi Home
};

// Name-pattern → device class (catches devices with no manufacturer data)
const CLASS_FROM_NAME_PATTERN: Array<[RegExp, DeviceClass]> = [
  [/^Globe[_\s-]/i,          'iot'],   // Globe Electric smart bulbs
  [/^GridConnect[_\s-]/i,    'iot'],   // Grid Connect (Woolworths AU smart home)
  [/^Tuya[_\s-]/i,           'iot'],   // Raw Tuya
  [/^SmartLife[_\s-]/i,      'iot'],   // Smart Life / Tuya app devices
  [/^Tapo[_\s-]/i,           'iot'],   // TP-Link Tapo
  [/^LIFX[_\s-]/i,           'iot'],   // LIFX bulbs
  [/^Kasa[_\s-]/i,           'iot'],   // TP-Link Kasa
  [/^ESP[_\s-]/i,            'iot'],   // ESP32/ESP8266 DIY devices
  [/^Mi[_\s]/i,              'iot'],   // Xiaomi Mi devices
  [/TV|SmartTV|BRAVIA/i,     'tv'],
  [/Soundbar|Speaker|Echo/i, 'audio'],
  [/Watch|Band|Fit[_\s]/i,   'wearable'],
  [/Nest\s*(Hub|Mini|Cam)/i, 'iot'],
];

// ─────────────────────────────────────────────────────────────────────────────
// POINT 9 — Chamber affinity
// Every device class maps to the chamber whose frequency best describes its role
// in the sovereign home field.
// ─────────────────────────────────────────────────────────────────────────────
type Chamber = 'OBIWAN' | 'AKRON' | 'ARKADAS' | 'DOJO' | 'TATA' | 'ATLAS' | 'KINGS_CHAMBER';

const CHAMBER_AFFINITY: Record<DeviceClass, Chamber> = {
  phone:    'OBIWAN',        // ● 963Hz — witness / memory carrier
  tablet:   'OBIWAN',        // ● 963Hz — witness
  computer: 'DOJO',          // ◼︎ 741Hz — cognition / mind
  audio:    'DOJO',          // ◼︎ 741Hz — sensory output
  display:  'DOJO',          // ◼︎ 741Hz — visual mind
  wearable: 'TATA',          // ▼ 432Hz — body truth / temporal signal
  printer:  'AKRON',         // ◻ 396Hz — archive, physical output
  beacon:   'ATLAS',         // ▲ 528Hz — navigation anchor
  iot:      'ARKADAS',       // ⊗ 852Hz — homeostatic field node
  tv:       'ARKADAS',       // ⊗ 852Hz — ambient field presence
  unknown:  'KINGS_CHAMBER', // ◎ 852Hz — needs synthesis / elevation
};

// ─────────────────────────────────────────────────────────────────────────────
// POINT 10 — Frequency colour (from theme.ts — not decoration)
// ─────────────────────────────────────────────────────────────────────────────
const CHAMBER_COLOR: Record<Chamber, typeof FREQ_COLORS[keyof typeof FREQ_COLORS]> = {
  OBIWAN:        FREQ_COLORS.OBIWAN,
  AKRON:         FREQ_COLORS.AKRON,
  ARKADAS:       FREQ_COLORS.ARKADAS,
  ATLAS:         FREQ_COLORS.ATLAS,
  DOJO:          FREQ_COLORS.DOJO,
  TATA:          FREQ_COLORS.TATA,
  KINGS_CHAMBER: FREQ_COLORS.KINGS_CHAMBER,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type AlignmentTier = 'aligned' | 'partial' | 'unaligned';
export type TrustVector   = 'known' | 'partial' | 'unknown';
export type ActionVector  = 'observe' | 'connect' | 'log' | 'seek-alignment';

export type MetatronDeviceProfile = {
  // Point 1
  manufacturer:    string | null;
  // Point 2
  name:            string | null;
  // Point 3
  deviceClass:     DeviceClass;
  // Point 4
  appleSubtype:    string | null;
  // Point 5
  serviceProfile:  string[];
  // Point 6
  signalTier:      string;
  // Point 7
  connectable:     boolean | null;
  // Point 8
  alignment:       AlignmentTier;
  // Point 9
  chamber:         Chamber;
  // Point 10
  color:           typeof FREQ_COLORS[keyof typeof FREQ_COLORS];
  // Point 11
  trust:           TrustVector;
  // Point 12
  action:          ActionVector;
  // Composed display
  label:           string;
  sublabel:        string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function parseManufacturerId(data: string | null | undefined): number | null {
  if (!data) return null;
  try {
    const b = atob(data);
    if (b.length < 2) return null;
    return b.charCodeAt(0) | (b.charCodeAt(1) << 8);
  } catch { return null; }
}

function parseAppleSubtype(data: string | null | undefined): string | null {
  if (!data) return null;
  try {
    const b = atob(data);
    const mfrId = b.charCodeAt(0) | (b.charCodeAt(1) << 8);
    if (mfrId !== 0x004C) return null;             // Apple only
    if (b.length < 3) return null;
    const typeKey = b.charCodeAt(2);
    return APPLE_CONTINUITY_TYPES[typeKey] ?? null;
  } catch { return null; }
}

function shortUuid(uuid: string): string {
  return uuid.toLowerCase().replace(/-/g, '').slice(0, 4);
}

function resolveClass(
  mfrId: number | null,
  serviceUUIDs: string[] | null | undefined,
  appleSubtype: string | null,
  name: string | null,
): DeviceClass {
  // Apple subtype refines phone class
  if (appleSubtype) {
    if (/AirPods|HomePod/i.test(appleSubtype))       return 'audio';
    if (/Watch/i.test(appleSubtype))                  return 'wearable';
    if (/AirTag|Find My/i.test(appleSubtype))         return 'beacon';
    if (/iPhone|iPad|Mac|Hotspot|Nearby/i.test(appleSubtype)) return 'phone';
    if (/TV|Cast/i.test(appleSubtype))                return 'tv';
    if (/HomeKit/i.test(appleSubtype))                return 'iot';
  }
  if (mfrId !== null && CLASS_FROM_MANUFACTURER_ID[mfrId]) {
    return CLASS_FROM_MANUFACTURER_ID[mfrId];
  }
  if (serviceUUIDs) {
    for (const uuid of serviceUUIDs) {
      const c = CLASS_FROM_SERVICE_UUID[shortUuid(uuid)];
      if (c) return c;
    }
  }
  // Name pattern fallback — catches Globe/Grid Connect and other IoT devices
  // that advertise with no manufacturer data or service UUIDs
  if (name) {
    for (const [pattern, cls] of CLASS_FROM_NAME_PATTERN) {
      if (pattern.test(name)) return cls;
    }
  }
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main translation function — the 12-point pass
// ─────────────────────────────────────────────────────────────────────────────
export function metatronTranslate(device: {
  name?:             string | null;
  manufacturerData?: string | null;
  serviceUUIDs?:     string[] | null;
  rssi?:             number | null;
  isConnectable?:    boolean | null;
}): MetatronDeviceProfile {

  // 1. Manufacturer
  const mfrId        = parseManufacturerId(device.manufacturerData);
  const rawMfr       = mfrId != null ? BT_COMPANY_IDS[mfrId] : null;
  // Normalise verbose BT SIG names to short friendly names
  const manufacturer = rawMfr ? normalise(rawMfr) : null;

  // 2. Device name
  const name = device.name ?? null;

  // 4. Apple subtype (needed before class)
  const appleSubtype = parseAppleSubtype(device.manufacturerData);

  // 3. Device class
  const deviceClass = resolveClass(mfrId, device.serviceUUIDs, appleSubtype, name);

  // 5. Service profile
  const serviceProfile: string[] = [];
  for (const uuid of device.serviceUUIDs ?? []) {
    const role = SERVICE_UUID_ROLES[shortUuid(uuid)];
    if (role) serviceProfile.push(role);
  }

  // 6. Signal tier
  const signalTier = rssiToTier(device.rssi ?? null);

  // 7. Connectable
  const connectable = device.isConnectable ?? null;

  // 8. Alignment tier
  const alignment = resolveAlignment(manufacturer, appleSubtype, serviceProfile, name);

  // 9. Chamber affinity
  const chamber = CHAMBER_AFFINITY[deviceClass];

  // 10. Frequency colour
  const color = CHAMBER_COLOR[chamber];

  // 11. Trust vector
  const trust = resolveTrust(alignment, mfrId);

  // 12. Action vector
  const action = resolveAction(alignment, deviceClass, connectable);

  // Composed display
  const label = composeLabel(manufacturer, appleSubtype, name, deviceClass, serviceProfile);
  const sublabel = composeSublabel(chamber, alignment, signalTier);

  return {
    manufacturer, name, deviceClass, appleSubtype,
    serviceProfile, signalTier, connectable,
    alignment, chamber, color, trust, action,
    label, sublabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supporting resolution functions
// ─────────────────────────────────────────────────────────────────────────────

/** Short friendly names for verbose BT SIG registrations */
function normalise(raw: string): string {
  return raw
    .replace(/,?\s*(Inc\.?|LLC\.?|Ltd\.?|Co\.?|Corp\.?|AB|GmbH|S\.A\.|BV|AG|ASA|PLC)$/i, '')
    .replace(/\s+(Technologies|Electronics|Solutions|Systems|Communications)$/i, '')
    .trim();
}

const SERVICE_UUID_ROLES: Record<string, string> = {
  '180d': 'Heart Rate',
  '180f': 'Battery',
  '1812': 'HID Input',
  '110b': 'Audio Sink',
  '1108': 'Headset',
  'fe9f': 'Nest / Cast',
  'fec9': 'Google Home',
  'fd50': 'Tuya Smart',
  'fecb': 'Tile Tracker',
  'feaa': 'Eddystone Beacon',
  'fff0': 'Smart Device',
  'ffe0': 'Smart Device',
  'fe8f': 'Google Service',
  'fd6f': 'Exposure Notify',
};

function rssiToTier(rssi: number | null): string {
  if (rssi === null) return 'unknown';
  if (rssi >= -50)   return '< 1 m';
  if (rssi >= -65)   return '1–3 m';
  if (rssi >= -75)   return '3–8 m';
  if (rssi >= -85)   return '8–20 m';
  return '> 20 m';
}

function resolveAlignment(
  manufacturer: string | null,
  appleSubtype: string | null,
  serviceProfile: string[],
  name: string | null,
): AlignmentTier {
  const hasRole = appleSubtype !== null || serviceProfile.length > 0 || name !== null;
  if (manufacturer && hasRole) return 'aligned';
  if (manufacturer || name)    return 'partial';
  return 'unaligned';
}

function resolveTrust(alignment: AlignmentTier, mfrId: number | null): TrustVector {
  if (alignment === 'aligned') return 'known';
  if (alignment === 'partial')  return 'partial';
  return 'unknown';
}

function resolveAction(
  alignment: AlignmentTier,
  deviceClass: DeviceClass,
  connectable: boolean | null,
): ActionVector {
  if (alignment === 'unaligned')  return 'seek-alignment';
  if (deviceClass === 'wearable') return 'observe';
  if (connectable === true)       return 'connect';
  return 'log';
}

function composeLabel(
  manufacturer: string | null,
  appleSubtype: string | null,
  name: string | null,
  deviceClass: DeviceClass,
  serviceProfile: string[],
): string {
  if (appleSubtype) return `Apple · ${appleSubtype}`;
  if (name && manufacturer) return `${manufacturer} · ${name}`;
  if (name) return name;
  if (manufacturer && serviceProfile.length > 0) return `${manufacturer} · ${serviceProfile[0]}`;
  if (manufacturer) return manufacturer;
  return '⬡ unaligned device';
}

function composeSublabel(
  chamber: Chamber,
  alignment: AlignmentTier,
  signalTier: string,
): string {
  const CHAMBER_GLYPHS: Record<Chamber, string> = {
    OBIWAN:        '● OBI-WAN · 963 Hz',
    AKRON:         '◻ AKRON · 396 Hz',
    ARKADAS:       '⊗ ARKADAS · 852 Hz',
    ATLAS:         '▲ ATLAS · 528 Hz',
    DOJO:          '◼ DOJO · 741 Hz',
    TATA:          '▼ TATA · 432 Hz',
    KINGS_CHAMBER: '◎ Kings Chamber · seeking alignment',
  };
  if (alignment === 'unaligned') return `◎ unaligned · seeking identity · ${signalTier}`;
  return `${CHAMBER_GLYPHS[chamber]} · ${signalTier}`;
}
