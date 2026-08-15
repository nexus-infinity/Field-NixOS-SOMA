/**
 * ZoneGeometry.ts — Normalised room polygons for PULSE spatial rendering
 *
 * Coordinates are normalised to [0, 1] relative to the floor plan image bounding box.
 * Source: assets/floorplans/IMG_9254.jpeg (1988 proposed plan, Christopher Lawrence Interiors, 1:100)
 *
 * Axis convention:
 *   (0,0) = top-left of plan image
 *   (1,0) = top-right
 *   (0,1) = bottom-left
 *   (1,1) = bottom-right
 *
 * Level convention:
 *   level  1 = upper side: family room, kitchen, lounge, formal areas (right in plan)
 *   level  0 = main/entry level: bedrooms, hallway, laundry, end room (left in plan)
 *   level -1 = below grade: cellar, formal lounge (5 steps down)
 *
 * Note: The 1988 plan shows "Rumpus" at far left — this is the End Room (INDOOR_END_ROOM).
 * The Backroom (OUTBUILD_BACKROOM) is the separate outbuilding on the NE corner near carport.
 */

import type { ZoneGeometry, Point } from './SpatialTypes';

// ─── Centroid helper ──────────────────────────────────────────────────────────

export function centroidOf(polygon: Point[]): Point {
  if (polygon.length === 0) return { x: 0.5, y: 0.5 };
  const x = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
  const y = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;
  return { x, y };
}

// ─── Raw zone definitions (centroid computed below) ───────────────────────────
type RawZone = Omit<ZoneGeometry, 'centroid'>;

const RAW_ZONES: RawZone[] = [

  // ── Entrance & hallway ──────────────────────────────────────────────────────
  {
    zoneId: 'indoor.entrance_hallway',
    polygon: [
      { x: 0.35, y: 0.25 }, { x: 0.55, y: 0.25 },
      { x: 0.55, y: 0.45 }, { x: 0.35, y: 0.45 },
    ],
    level: 0,
    label: 'Hallway',
  },

  // ── Study / den (left of entrance) ─────────────────────────────────────────
  {
    zoneId: 'indoor.study_den',
    polygon: [
      { x: 0.22, y: 0.22 }, { x: 0.35, y: 0.22 },
      { x: 0.35, y: 0.45 }, { x: 0.22, y: 0.45 },
    ],
    level: 0,
    label: 'Study',
  },

  // ── Formal lounge (5 steps down — semi-basement) ───────────────────────────
  {
    zoneId: 'indoor.formal_lounge',
    polygon: [
      { x: 0.22, y: 0.45 }, { x: 0.40, y: 0.45 },
      { x: 0.40, y: 0.65 }, { x: 0.22, y: 0.65 },
    ],
    level: -1,
    label: 'Formal Lounge',
  },

  // ── Formal dining ──────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.formal_dining',
    polygon: [
      { x: 0.40, y: 0.45 }, { x: 0.55, y: 0.45 },
      { x: 0.55, y: 0.65 }, { x: 0.40, y: 0.65 },
    ],
    level: 0,
    label: 'Formal Dining',
  },

  // ── Laundry ────────────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.laundry',
    polygon: [
      { x: 0.55, y: 0.45 }, { x: 0.68, y: 0.45 },
      { x: 0.68, y: 0.58 }, { x: 0.55, y: 0.58 },
    ],
    level: 0,
    label: 'Laundry',
  },

  // ── Kitchen ────────────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.kitchen',
    polygon: [
      { x: 0.55, y: 0.30 }, { x: 0.72, y: 0.30 },
      { x: 0.72, y: 0.45 }, { x: 0.55, y: 0.45 },
    ],
    level: 1,
    label: 'Kitchen',
  },

  // ── Kitchen dining (table area) ────────────────────────────────────────────
  {
    zoneId: 'indoor.kitchen_dining',
    polygon: [
      { x: 0.72, y: 0.30 }, { x: 0.88, y: 0.30 },
      { x: 0.88, y: 0.52 }, { x: 0.72, y: 0.52 },
    ],
    level: 1,
    label: 'Kitchen Dining',
  },

  // ── Powder room (guest toilet) ─────────────────────────────────────────────
  {
    zoneId: 'indoor.powder_room',
    polygon: [
      { x: 0.68, y: 0.45 }, { x: 0.76, y: 0.45 },
      { x: 0.76, y: 0.58 }, { x: 0.68, y: 0.58 },
    ],
    level: 0,
    label: 'Powder Room',
  },

  // ── Family room (upper level — heating intake + thermostat) ───────────────
  {
    zoneId: 'indoor.family_room',
    polygon: [
      { x: 0.76, y: 0.20 }, { x: 1.00, y: 0.20 },
      { x: 1.00, y: 0.52 }, { x: 0.76, y: 0.52 },
    ],
    level: 1,
    label: 'Family Room',
  },

  // ── Central bathroom ───────────────────────────────────────────────────────
  {
    zoneId: 'indoor.central_bathroom',
    polygon: [
      { x: 0.30, y: 0.58 }, { x: 0.42, y: 0.58 },
      { x: 0.42, y: 0.70 }, { x: 0.30, y: 0.70 },
    ],
    level: 0,
    label: 'Central Bathroom',
  },

  // ── Master bedroom ─────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.master_bedroom',
    polygon: [
      { x: 0.42, y: 0.58 }, { x: 0.68, y: 0.58 },
      { x: 0.68, y: 0.78 }, { x: 0.42, y: 0.78 },
    ],
    level: 0,
    label: 'Master Bedroom',
  },

  // ── Master dressing ────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.master_dressing',
    polygon: [
      { x: 0.68, y: 0.58 }, { x: 0.80, y: 0.58 },
      { x: 0.80, y: 0.68 }, { x: 0.68, y: 0.68 },
    ],
    level: 0,
    label: 'Master Dressing',
  },

  // ── Master ensuite ─────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.master_ensuite',
    polygon: [
      { x: 0.68, y: 0.68 }, { x: 0.80, y: 0.68 },
      { x: 0.80, y: 0.78 }, { x: 0.68, y: 0.78 },
    ],
    level: 0,
    label: 'Master Ensuite',
  },

  // ── Sauna ──────────────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.sauna',
    polygon: [
      { x: 0.80, y: 0.58 }, { x: 0.92, y: 0.58 },
      { x: 0.92, y: 0.72 }, { x: 0.80, y: 0.72 },
    ],
    level: 0,
    label: 'Sauna',
  },

  // ── Bedroom 2 ──────────────────────────────────────────────────────────────
  {
    zoneId: 'indoor.bedroom_2',
    polygon: [
      { x: 0.10, y: 0.55 }, { x: 0.30, y: 0.55 },
      { x: 0.30, y: 0.72 }, { x: 0.10, y: 0.72 },
    ],
    level: 0,
    label: 'Bedroom 2',
  },

  // ── Bedroom 3 (walk-through) ───────────────────────────────────────────────
  {
    zoneId: 'indoor.bedroom_3',
    polygon: [
      { x: 0.05, y: 0.35 }, { x: 0.22, y: 0.35 },
      { x: 0.22, y: 0.55 }, { x: 0.05, y: 0.55 },
    ],
    level: 0,
    label: 'Bedroom 3',
  },

  // ── Bedroom 4 (walk-through) ───────────────────────────────────────────────
  {
    zoneId: 'indoor.bedroom_4',
    polygon: [
      { x: 0.05, y: 0.22 }, { x: 0.22, y: 0.22 },
      { x: 0.22, y: 0.35 }, { x: 0.05, y: 0.35 },
    ],
    level: 0,
    label: 'Bedroom 4',
  },

  // ── End Room (far left, 1 step down, timber frame on stumps — NOT Backroom) ─
  {
    zoneId: 'indoor.end_room',
    polygon: [
      { x: 0.02, y: 0.55 }, { x: 0.10, y: 0.55 },
      { x: 0.10, y: 0.80 }, { x: 0.02, y: 0.80 },
    ],
    level: 0,
    label: 'End Room',
  },

  // ── Bathroom (near end room) ───────────────────────────────────────────────
  {
    zoneId: 'indoor.bathroom',
    polygon: [
      { x: 0.10, y: 0.72 }, { x: 0.22, y: 0.72 },
      { x: 0.22, y: 0.82 }, { x: 0.10, y: 0.82 },
    ],
    level: 0,
    label: 'Bathroom',
  },

  // ── Outbuildings ───────────────────────────────────────────────────────────

  {
    zoneId: 'outbuild.carport',
    polygon: [
      { x: 0.55, y: 0.05 }, { x: 0.85, y: 0.05 },
      { x: 0.85, y: 0.20 }, { x: 0.55, y: 0.20 },
    ],
    level: 0,
    label: 'Carport',
  },

  {
    zoneId: 'outbuild.storage',
    polygon: [
      { x: 0.85, y: 0.05 }, { x: 1.00, y: 0.05 },
      { x: 1.00, y: 0.20 }, { x: 0.85, y: 0.20 },
    ],
    level: 0,
    label: 'Storage',
  },

  // Backroom: NE corner, near carport, 3 steps up — separate outbuilding
  {
    zoneId: 'outbuild.backroom',
    polygon: [
      { x: 0.22, y: 0.05 }, { x: 0.55, y: 0.05 },
      { x: 0.55, y: 0.22 }, { x: 0.22, y: 0.22 },
    ],
    level: 1,
    label: 'Backroom',
  },

  // Cellar: between back door and carport, sunken concrete pipe
  {
    zoneId: 'outbuild.cellar',
    polygon: [
      { x: 0.55, y: 0.58 }, { x: 0.68, y: 0.58 },
      { x: 0.68, y: 0.72 }, { x: 0.55, y: 0.72 },
    ],
    level: -1,
    label: 'Cellar',
  },

  // ── Front approach ─────────────────────────────────────────────────────────

  {
    zoneId: 'front.gate',
    polygon: [
      { x: 0.00, y: 0.00 }, { x: 0.10, y: 0.00 },
      { x: 0.10, y: 0.08 }, { x: 0.00, y: 0.08 },
    ],
    level: 0,
    label: 'Front Gate',
  },

  {
    zoneId: 'front.driveway',
    polygon: [
      { x: 0.00, y: 0.08 }, { x: 0.22, y: 0.08 },
      { x: 0.22, y: 0.22 }, { x: 0.00, y: 0.22 },
    ],
    level: 0,
    label: 'Driveway',
  },

  // ── Garden levels ──────────────────────────────────────────────────────────

  {
    zoneId: 'garden.terrace',
    polygon: [
      { x: 0.55, y: 0.65 }, { x: 0.80, y: 0.65 },
      { x: 0.80, y: 0.80 }, { x: 0.55, y: 0.80 },
    ],
    level: 1,
    label: 'Terrace',
  },

  {
    zoneId: 'garden.back_terrace',
    polygon: [
      { x: 0.80, y: 0.52 }, { x: 1.00, y: 0.52 },
      { x: 1.00, y: 0.65 }, { x: 0.80, y: 0.65 },
    ],
    level: 1,
    label: 'Back Terrace',
  },

  {
    zoneId: 'garden.clothesline',
    polygon: [
      { x: 0.55, y: 0.80 }, { x: 0.70, y: 0.80 },
      { x: 0.70, y: 0.88 }, { x: 0.55, y: 0.88 },
    ],
    level: 0,
    label: 'Clothesline',
  },

  {
    zoneId: 'garden.hot_water',
    polygon: [
      { x: 0.70, y: 0.80 }, { x: 0.82, y: 0.80 },
      { x: 0.82, y: 0.90 }, { x: 0.70, y: 0.90 },
    ],
    level: 0,
    label: 'Hot Water Unit',
  },

  {
    zoneId: 'garden.l1_lower_terrace',
    polygon: [
      { x: 0.10, y: 0.65 }, { x: 0.42, y: 0.65 },
      { x: 0.42, y: 0.82 }, { x: 0.10, y: 0.82 },
    ],
    level: 0,
    label: 'Lower Terrace',
  },

  {
    zoneId: 'garden.l2_pool',
    polygon: [
      { x: 0.10, y: 0.82 }, { x: 0.55, y: 0.82 },
      { x: 0.55, y: 0.95 }, { x: 0.10, y: 0.95 },
    ],
    level: -1,
    label: 'Pool',
  },

  {
    zoneId: 'garden.l2_bbq',
    polygon: [
      { x: 0.55, y: 0.88 }, { x: 0.72, y: 0.88 },
      { x: 0.72, y: 1.00 }, { x: 0.55, y: 1.00 },
    ],
    level: -1,
    label: 'BBQ',
  },

  {
    zoneId: 'side.lawn',
    polygon: [
      { x: 0.00, y: 0.55 }, { x: 0.05, y: 0.55 },
      { x: 0.05, y: 0.90 }, { x: 0.00, y: 0.90 },
    ],
    level: 0,
    label: 'Side Lawn',
  },

  // ── Utility / infrastructure nodes ─────────────────────────────────────────

  {
    zoneId: 'utility.service_entry',
    polygon: [
      { x: 0.45, y: 0.00 }, { x: 0.55, y: 0.00 },
      { x: 0.55, y: 0.08 }, { x: 0.45, y: 0.08 },
    ],
    level: 0,
    label: 'Service Entry',
  },

  {
    zoneId: 'utility.solar_inverter',
    polygon: [
      { x: 0.28, y: 0.00 }, { x: 0.45, y: 0.00 },
      { x: 0.45, y: 0.08 }, { x: 0.28, y: 0.08 },
    ],
    level: 0,
    label: 'Solar Inverter',
  },

  {
    zoneId: 'utility.gas_meter',
    polygon: [
      { x: 0.55, y: 0.00 }, { x: 0.63, y: 0.00 },
      { x: 0.63, y: 0.08 }, { x: 0.55, y: 0.08 },
    ],
    level: 0,
    label: 'Gas Meter',
  },

  {
    zoneId: 'utility.electric_meter',
    polygon: [
      { x: 0.63, y: 0.00 }, { x: 0.72, y: 0.00 },
      { x: 0.72, y: 0.08 }, { x: 0.63, y: 0.08 },
    ],
    level: 0,
    label: 'Elec Meter',
  },

  {
    zoneId: 'utility.plant_room',
    polygon: [
      { x: 0.55, y: 0.72 }, { x: 0.68, y: 0.72 },
      { x: 0.68, y: 0.82 }, { x: 0.55, y: 0.82 },
    ],
    level: 0,
    label: 'Plant Room',
  },

  {
    zoneId: 'utility.hot_water_unit',
    polygon: [
      { x: 0.82, y: 0.80 }, { x: 0.95, y: 0.80 },
      { x: 0.95, y: 0.92 }, { x: 0.82, y: 0.92 },
    ],
    level: 0,
    label: 'HWU (back fence)',
  },

  {
    zoneId: 'utility.pool_pumps',
    polygon: [
      { x: 0.00, y: 0.88 }, { x: 0.10, y: 0.88 },
      { x: 0.10, y: 0.98 }, { x: 0.00, y: 0.98 },
    ],
    level: -1,
    label: 'Pool Pumps',
  },

  {
    zoneId: 'utility.irrigation_header',
    polygon: [
      { x: 0.72, y: 0.88 }, { x: 0.85, y: 0.88 },
      { x: 0.85, y: 1.00 }, { x: 0.72, y: 1.00 },
    ],
    level: -1,
    label: 'Irrigation Header',
  },

  {
    zoneId: 'utility.water_tank',
    polygon: [
      { x: 0.00, y: 0.78 }, { x: 0.08, y: 0.78 },
      { x: 0.08, y: 0.88 }, { x: 0.00, y: 0.88 },
    ],
    level: 0,
    label: 'Water Tank (100kL)',
  },

  {
    zoneId: 'utility.ducted_heating',
    polygon: [
      { x: 0.76, y: 0.52 }, { x: 0.88, y: 0.52 },
      { x: 0.88, y: 0.58 }, { x: 0.76, y: 0.58 },
    ],
    level: 1,
    label: 'Ducted Heating',
  },
];

// Compute centroids automatically and export as typed ZoneGeometry[]
export const ZONE_POLYGONS: ZoneGeometry[] = RAW_ZONES.map(z => ({
  ...z,
  centroid: centroidOf(z.polygon),
}));

// Lookup map by zoneId for O(1) access
export const ZONE_POLYGON_MAP: Map<string, ZoneGeometry> = new Map(
  ZONE_POLYGONS.map(z => [z.zoneId, z]),
);
