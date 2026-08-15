/**
 * SpatialTypes — PULSE spatial rendering contract
 *
 * Architecture:
 *   Veneer  = visual style   (how the house looks)
 *   Layer   = data overlay   (what information is shown on top)
 *
 * Any veneer works with any combination of layers. Examples:
 *   IsometricVeneer + ElectricalLayer   → warm dollhouse, circuits glowing
 *   FlatPlanVeneer  + PlumbingLayer     → blueprint with pipe runs
 *   WatercolourVeneer + IrrigationLayer → garden painting + valve states
 *
 * Benchmarks that informed this design:
 *   - Apple Home / Homey: room lists only, no spatial plan
 *   - Home Assistant: spatial plan but technically heavy, not warm
 *   - Magicplan / CubiCasa: great plans, zero device control
 *   - PULSE fills the gap: sovereign, warm, spatially-aware home OS
 */

import type { ZoneId } from '../deviceRegistry';

// ─── Veneers (visual presentation style) ──────────────────────────────────────

export type VeneerId =
  | 'flat_plan'       // top-down SVG floor plan (foundation — build first)
  | 'isometric'       // warm dollhouse cutaway at ~40° (target style)
  | 'watercolour'     // botanical/painted — garden zones
  | 'ar';             // first-person augmented reality (future)

export const VENEER_LABELS: Record<VeneerId, string> = {
  flat_plan:   'Floor Plan',
  isometric:   'Dollhouse',
  watercolour: 'Garden View',
  ar:          'Walk-Through (AR)',
};

// ─── Layers (data overlays — toggled independently of veneer) ─────────────────

export type LayerId =
  | 'devices'         // BLE device pins (RSSI-sized dots) — always visible by default
  | 'electrical'      // circuits, power points, DB board, solar feed, meters
  | 'plumbing'        // pipe runs, HWU, cellar drain, taps, irrigation header
  | 'hvac'            // duct runs, zones, thermostat, vents, furnace
  | 'irrigation'      // valve zones, drip lines, sprinkler heads, tank feeds
  | 'underground'     // structural — cellar, slab edge, stumps (End Room), drainage
  | 'solar'           // solar panel positions on roof, DC runs, inverter feed
  | 'security';       // camera coverage zones, motion sensors, entry points

export const LAYER_LABELS: Record<LayerId, string> = {
  devices:     'Devices',
  electrical:  'Electrical',
  plumbing:    'Plumbing',
  hvac:        'Heating & Cooling',
  irrigation:  'Irrigation',
  underground: 'Underground',
  solar:       'Solar',
  security:    'Security',
};

// Layers available per veneer (some layers only make sense on certain veneers)
export const VENEER_LAYER_SUPPORT: Record<VeneerId, LayerId[]> = {
  flat_plan:   ['devices', 'electrical', 'plumbing', 'hvac', 'irrigation', 'underground', 'solar', 'security'],
  isometric:   ['devices', 'electrical', 'hvac', 'solar', 'security'],
  watercolour: ['devices', 'irrigation', 'plumbing'],
  ar:          ['devices', 'security'],
};

// ─── Zone geometry ─────────────────────────────────────────────────────────────

/** Normalised coordinate space: (0,0) = top-left of floor plan bounding box, (1,1) = bottom-right */
export interface Point {
  x: number;
  y: number;
}

export interface ZoneGeometry {
  zoneId:   ZoneId;
  polygon:  Point[];   // clockwise winding, normalised 0–1
  centroid: Point;     // pre-computed centre for device pin placement
  level:    number;    // floor level: 0 = main, 1 = upper (family room side), -1 = below (cellar)
  label?:   string;    // override ZONE_LABELS if needed for map display
}

// ─── Device pins (pre-processed for renderers) ────────────────────────────────

export interface DevicePin {
  deviceId:    string;
  zoneId:      ZoneId | null;
  position:    Point;          // centroid of assigned zone, or null-zone staging area
  rssiAvg:     number | null;  // averaged RSSI for sizing
  aligned:     boolean;        // registered by user (solid) vs auto-detected (dashed)
  label:       string | null;
}

// ─── Layer data payloads ───────────────────────────────────────────────────────

export interface ElectricalNode {
  id:       string;
  type:     'circuit' | 'outlet' | 'switch' | 'panel' | 'solar_feed' | 'meter';
  label:    string;
  position: Point;
  zoneId:   ZoneId | null;
  phase?:   'R' | 'S' | 'T' | 'single';   // 3-phase for SOFAR Solar feeds
  notes?:   string;
}

export interface PlumbingNode {
  id:       string;
  type:     'pipe_run' | 'tap' | 'drain' | 'hwu' | 'meter' | 'valve';
  label:    string;
  position: Point;
  zoneId:   ZoneId | null;
  notes?:   string;
}

export interface HvacNode {
  id:       string;
  type:     'duct_run' | 'vent' | 'thermostat' | 'intake' | 'furnace' | 'ac_head' | 'ac_external';
  label:    string;
  position: Point;
  zoneId:   ZoneId | null;
  notes?:   string;
}

export interface IrrigationNode {
  id:       string;
  type:     'valve' | 'head' | 'drip_run' | 'header_tank' | 'water_tank' | 'pump';
  label:    string;
  position: Point;
  zoneId:   ZoneId | null;
  notes?:   string;
}

export interface UndergroundNode {
  id:       string;
  type:     'slab_edge' | 'stump' | 'cellar' | 'drain' | 'pipe_sleeve';
  label:    string;
  position: Point;
  zoneId:   ZoneId | null;
  notes?:   string;
}

// ─── Spatial map props — the contract every veneer receives ───────────────────

export interface SpatialMapProps {
  // Geometry
  zones:          ZoneGeometry[];

  // Veneer + active layers
  veneer:         VeneerId;
  activeLayers:   LayerId[];

  // Device layer data
  devicePins:     DevicePin[];
  currentZoneId:  ZoneId | null;       // your BLE-detected location

  // Infrastructure layer data (null = layer not yet mapped)
  electricalNodes:   ElectricalNode[]   | null;
  plumbingNodes:     PlumbingNode[]     | null;
  hvacNodes:         HvacNode[]         | null;
  irrigationNodes:   IrrigationNode[]   | null;
  undergroundNodes:  UndergroundNode[]  | null;

  // Interaction
  onZoneTap:      (zoneId: ZoneId) => void;
  onDeviceTap:    (deviceId: string) => void;
  onLayerToggle:  (layerId: LayerId) => void;
  onVeneerChange: (veneerId: VeneerId) => void;

  // Canvas dimensions (pixels) — provided by SpatialRenderer layout
  width:  number;
  height: number;
}
