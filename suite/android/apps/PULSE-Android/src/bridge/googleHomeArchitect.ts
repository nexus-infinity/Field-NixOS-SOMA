import { KNOWN_SYSTEMS, ZONE_LABELS, HouseSystem } from '../deviceRegistry';

/**
 * googleHomeArchitect.ts
 * 
 * The Inception Architect Library
 * 
 * This is the library of pre-constructed scene blocks.
 * It maps the TRUE reality (PULSE Prime Geometry) into the lower-level
 * semantic interface of Google Home.
 */

export const GoogleTypes = {
  THERMOSTAT: 'action.devices.types.THERMOSTAT',
  TV: 'action.devices.types.TV',
  SPEAKER: 'action.devices.types.SPEAKER',
  WATER_HEATER: 'action.devices.types.WATERHEATER',
  SPRINKLER: 'action.devices.types.SPRINKLER',
  GATE: 'action.devices.types.GATE',
  SENSOR: 'action.devices.types.SENSOR'
} as const;

export const GoogleTraits = {
  ON_OFF: 'action.devices.traits.OnOff',
  TEMP_SETTING: 'action.devices.traits.TemperatureSetting',
  VOLUME: 'action.devices.traits.Volume',
  OPEN_CLOSE: 'action.devices.traits.OpenClose',
  START_STOP: 'action.devices.traits.StartStop'
} as const;

export function constructGoogleSyncPayload() {
  const devices = KNOWN_SYSTEMS.map(system => {
    return constructDeviceBlock(system);
  }).filter(Boolean);

  return {
    requestId: 'req-' + Date.now(),
    payload: {
      agentUserId: 'pulse.mteliza.bridge',
      devices
    }
  };
}

function constructDeviceBlock(system: HouseSystem) {
  let type: string;
  let traits: string[] = [];

  switch (system.category) {
    case 'heating':
      type = GoogleTypes.THERMOSTAT;
      traits = [GoogleTraits.ON_OFF, GoogleTraits.TEMP_SETTING];
      break;
    case 'audio':
      type = system.name.includes('TV') ? GoogleTypes.TV : GoogleTypes.SPEAKER;
      traits = [GoogleTraits.ON_OFF, GoogleTraits.VOLUME];
      break;
    case 'security':
      type = GoogleTypes.GATE;
      traits = [GoogleTraits.OPEN_CLOSE];
      break;
    case 'irrigation':
      type = GoogleTypes.SPRINKLER;
      traits = [GoogleTraits.START_STOP];
      break;
    default:
      return null;
  }

  return {
    id: system.id,
    type,
    traits,
    name: {
      name: system.name,
      defaultNames: [system.name],
      nicknames: [system.name.split(' ')[0]]
    },
    willReportState: false,
    roomHint: system.zone ? ZONE_LABELS[system.zone] : undefined,
    customData: {
      pulse_sovereign_geometry: system.zone || 'unmapped',
      envelope_protocol: 'Recommendation'
    }
  };
}