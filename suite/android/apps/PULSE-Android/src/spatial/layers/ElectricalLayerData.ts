/**
 * ElectricalLayerData — 10 Watts Parade, Mount Eliza
 *
 * Node positions are normalised (0–1) centroids derived from ZoneGeometry polygons.
 * SOFAR Solar = SOFAR HYD 21KTL-3PH, 21kVA 3-phase inverter, northern wall behind wooden screen.
 * DB board = laundry, contains main switch + security system + router circuit.
 * Service entry = eastern wall (northern boundary) — Telstra + electricity + gas entries.
 */

import { ElectricalNode } from '../SpatialTypes';

export const ELECTRICAL_NODES: ElectricalNode[] = [

  // ── Solar Generation ──────────────────────────────────────────────────────

  {
    id:       'solar_inverter',
    type:     'solar_feed',
    label:    'SOFAR Solar Inverter',
    position: { x: 0.365, y: 0.04 },  // centroid of utility.solar_inverter zone
    zoneId:   'utility.solar_inverter',
    notes:    'SOFAR HYD 21KTL-3PH — 21kVA 3-phase, northern wall behind wooden screen. SN: H21KTL7…',
  },
  {
    id:       'solar_phase_r',
    type:     'circuit',
    label:    'Solar Phase R',
    position: { x: 0.34, y: 0.07 },
    zoneId:   'utility.solar_inverter',
    phase:    'R',
    notes:    'Phase R output from SOFAR inverter to main switchboard',
  },
  {
    id:       'solar_phase_s',
    type:     'circuit',
    label:    'Solar Phase S',
    position: { x: 0.365, y: 0.07 },
    zoneId:   'utility.solar_inverter',
    phase:    'S',
    notes:    'Phase S output from SOFAR inverter to main switchboard',
  },
  {
    id:       'solar_phase_t',
    type:     'circuit',
    label:    'Solar Phase T',
    position: { x: 0.39, y: 0.07 },
    zoneId:   'utility.solar_inverter',
    phase:    'T',
    notes:    'Phase T output from SOFAR inverter to main switchboard',
  },

  // ── Metering ─────────────────────────────────────────────────────────────

  {
    id:       'electric_meter',
    type:     'meter',
    label:    'Electricity Meter',
    position: { x: 0.675, y: 0.04 },  // centroid of utility.electric_meter zone
    zoneId:   'utility.electric_meter',
    notes:    'Landis+Gyr import/export meter — grid connection + solar export. Ref: IMG_1075',
  },
  {
    id:       'gas_meter',
    type:     'meter',
    label:    'Gas Meter',
    position: { x: 0.59, y: 0.04 },   // centroid of utility.gas_meter zone
    zoneId:   'utility.gas_meter',
    notes:    'Gas meter on northern boundary wall — supplies HWU, furnace, booster',
  },

  // ── Main Distribution Board ───────────────────────────────────────────────

  {
    id:       'db_main',
    type:     'panel',
    label:    'Main DB Board',
    position: { x: 0.615, y: 0.515 }, // centroid of indoor.laundry zone
    zoneId:   'indoor.laundry',
    notes:    'Main distribution board in laundry — 3-phase from grid + solar. Houses security circuit + router circuit.',
  },
  {
    id:       'circuit_security',
    type:     'circuit',
    label:    'Security System',
    position: { x: 0.60, y: 0.52 },
    zoneId:   'indoor.laundry',
    phase:    'single',
    notes:    'Dedicated circuit for security panel — co-located with DB board in laundry',
  },
  {
    id:       'circuit_laundry_router',
    type:     'circuit',
    label:    'Laundry Router',
    position: { x: 0.63, y: 0.52 },
    zoneId:   'indoor.laundry',
    phase:    'single',
    notes:    'Router circuit in laundry — serves as building backbone node',
  },

  // ── Utility / Service Entry ───────────────────────────────────────────────

  {
    id:       'service_entry',
    type:     'panel',
    label:    'Service Entry',
    position: { x: 0.50, y: 0.04 },   // northern boundary, east of solar inverter
    zoneId:   'utility.service_entry',
    notes:    'Eastern wall (northern boundary) — Telstra + electricity + gas enter here. Ref: service entry photos.',
  },

  // ── Hot Water Unit (gas-fired, back fence) ────────────────────────────────

  {
    id:       'hwu_connection',
    type:     'circuit',
    label:    'HWU Power',
    position: { x: 0.76, y: 0.85 },   // centroid of garden.hot_water zone
    zoneId:   'garden.hot_water',
    phase:    'single',
    notes:    'Electrical supply to gas HWU control — back fence, directly behind laundry. Gas primary; electric ignition/control.',
  },

  // ── Plant Room (furnace + booster) ────────────────────────────────────────

  {
    id:       'furnace_power',
    type:     'circuit',
    label:    'Gas Furnace',
    position: { x: 0.60, y: 0.77 },   // centroid of utility.plant_room zone
    zoneId:   'utility.plant_room',
    phase:    'single',
    notes:    'Electric ignition/control for gas ducted furnace. Room adjacent (south) of laundry.',
  },
  {
    id:       'hwu_booster',
    type:     'circuit',
    label:    'HWU Booster',
    position: { x: 0.64, y: 0.77 },
    zoneId:   'utility.plant_room',
    phase:    'single',
    notes:    'Booster circuit for hot water — plant room. Gas-fired, potential heat-pump upgrade candidate.',
  },
];

/** Convenience accessor for a single node by id */
export function getElectricalNode(id: string): ElectricalNode | undefined {
  return ELECTRICAL_NODES.find(n => n.id === id);
}
