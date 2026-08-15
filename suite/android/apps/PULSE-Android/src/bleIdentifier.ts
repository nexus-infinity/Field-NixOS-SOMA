/**
 * BLE Device Identification
 * Decodes manufacturer IDs and service UUIDs into human-readable labels.
 * Sources: Bluetooth SIG Assigned Numbers
 */

import BT_COMPANY_IDS from './btCompanyIds';
import { atob } from './core/base64';
export { metatronTranslate } from './metatronBleTranslate';
export type { MetatronDeviceProfile, AlignmentTier } from './metatronBleTranslate';

/** 16-bit service UUIDs → device role */
const SERVICE_UUIDS: Record<string, string> = {
  '1800': 'Generic Access',
  '180a': 'Device Info',
  '180d': 'Heart Rate',
  '180f': 'Battery',
  '1812': 'HID Input',        // keyboard, mouse, controller
  '110b': 'Audio Sink',       // headphones / speakers
  '110a': 'Audio Source',
  '1108': 'Headset',
  'fe9f': 'Google Nest / Cast',
  'fec9': 'Google Home',
  'fd50': 'Tuya Smart',       // Grid Connect / Tuya platform
  'fd5a': 'Hearing Aid',
  'feaa': 'Eddystone Beacon',
  'fd6f': 'COVID Exposure',
  'fecb': 'Tile',
  'fe95': 'Xiaomi',
  'fe03': 'ANT+',
  'fff0': 'Smart Device',     // generic Tuya / IoT
  'ffe0': 'Smart Device',     // common IoT serial bridge
  'fe8f': 'Google',
};

/**
 * Name-based patterns — matched when device.name is present.
 * Order matters: more specific patterns first.
 */
const NAME_PATTERNS: Array<{ pattern: RegExp; manufacturer: string; role: string }> = [
  // Epson
  { pattern: /ET[-\s]?\d{4}/i,        manufacturer: 'Epson',          role: 'EcoTank Printer' },
  { pattern: /EPSON/i,                 manufacturer: 'Epson',          role: 'Printer' },
  // Apple
  { pattern: /^AirPods/i,             manufacturer: 'Apple',          role: 'AirPods' },
  { pattern: /^Apple TV/i,            manufacturer: 'Apple',          role: 'Apple TV' },
  { pattern: /^iPhone/i,              manufacturer: 'Apple',          role: 'iPhone' },
  { pattern: /^iPad/i,                manufacturer: 'Apple',          role: 'iPad' },
  { pattern: /^MacBook/i,             manufacturer: 'Apple',          role: 'MacBook' },
  { pattern: /Studio Display/i,       manufacturer: 'Apple',          role: 'Studio Display' },
  { pattern: /Mac Studio/i,           manufacturer: 'Apple',          role: 'Mac Studio' },
  // Samsung
  { pattern: /Smart Monitor/i,        manufacturer: 'Samsung',        role: 'Smart Monitor' },
  { pattern: /^Galaxy/i,              manufacturer: 'Samsung',        role: 'Phone / Tablet' },
  { pattern: /^SM-[A-Z]\d{3}/i,       manufacturer: 'Samsung',        role: 'Phone / Tablet' },
  // Google / Nest
  { pattern: /^Nest/i,                manufacturer: 'Google',         role: 'Nest Device' },
  { pattern: /^Google Home/i,         manufacturer: 'Google',         role: 'Smart Speaker' },
  { pattern: /^Chromecast/i,          manufacturer: 'Google',         role: 'Chromecast' },
  // Smart lights — Globe brand, generic smart bulbs
  { pattern: /Globe/i,                manufacturer: 'Globe',          role: 'Smart Bulb' },
  { pattern: /GC[-_\s]/i,             manufacturer: 'Grid Connect',   role: 'Smart Device' },
  { pattern: /Grid/i,                 manufacturer: 'Grid Connect',   role: 'Smart Device' },
  { pattern: /Govee/i,                manufacturer: 'Govee',          role: 'Smart Light' },
  { pattern: /Hue/i,                  manufacturer: 'Philips',        role: 'Hue Light' },
  { pattern: /LIFX/i,                 manufacturer: 'LIFX',           role: 'Smart Light' },
  // Generic smart home
  { pattern: /Smart Bulb|SmartBulb/i, manufacturer: 'Smart Light',   role: 'Bulb' },
  { pattern: /Tuya/i,                 manufacturer: 'Tuya',           role: 'Smart Device' },
];

function parseManufacturerId(manufacturerData: string | null | undefined): number | null {
  if (!manufacturerData) return null;
  try {
    const binary = atob(manufacturerData);
    if (binary.length < 2) return null;
    return binary.charCodeAt(0) | (binary.charCodeAt(1) << 8);
  } catch {
    return null;
  }
}

function parseServiceHints(serviceUUIDs: string[] | null | undefined): string[] {
  if (!serviceUUIDs || serviceUUIDs.length === 0) return [];
  return serviceUUIDs
    .map(uuid => {
      const short = uuid.toLowerCase().replace(/-/g, '').slice(0, 4);
      return SERVICE_UUIDS[short] ?? null;
    })
    .filter(Boolean) as string[];
}

export type DeviceLabel = {
  manufacturer: string | null;
  role: string | null;
  display: string;
};

export function identifyDevice(device: {
  name?: string | null;
  manufacturerData?: string | null;
  serviceUUIDs?: string[] | null;
  rssi?: number | null;
}): DeviceLabel {
  if (device.name) {
    for (const p of NAME_PATTERNS) {
      if (p.pattern.test(device.name)) {
        return {
          manufacturer: p.manufacturer,
          role: p.role,
          display: `${device.name}  ·  ${p.role}`,
        };
      }
    }
    return { manufacturer: null, role: null, display: device.name };
  }

  const mfrId = parseManufacturerId(device.manufacturerData);
  const manufacturer = mfrId != null ? (BT_COMPANY_IDS[mfrId] ?? `Mfr 0x${mfrId.toString(16).padStart(4, '0')}`) : null;
  const roles = parseServiceHints(device.serviceUUIDs);
  const role = roles.length > 0 ? roles.join(' · ') : null;

  const parts = [manufacturer, role].filter(Boolean);
  const display = parts.length > 0 ? parts.join(' — ') : '(unknown)';

  return { manufacturer, role, display };
}

/** Rough distance estimate from RSSI (Friis path loss, txPower assumed -59dBm) */
export function rssiToDistance(rssi: number): string {
  if (rssi >= -50)  return '< 1m';
  if (rssi >= -65)  return '~1–3m';
  if (rssi >= -75)  return '~3–8m';
  if (rssi >= -85)  return '~8–20m';
  return '> 20m';
}
