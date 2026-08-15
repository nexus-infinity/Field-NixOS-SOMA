/**
 * PlumbingLayerData — 10 Watts Parade, Mount Eliza
 *
 * Node positions are normalised (0–1) centroids derived from ZoneGeometry polygons.
 * Gas supply: enters northern boundary → hot water unit (back fence) + furnace + booster in plant room.
 * Cold water: Yarra Valley Water service from street. No greywater system yet.
 */

import { PlumbingNode } from '../SpatialTypes';

export const PLUMBING_NODES: PlumbingNode[] = [

  // ── Gas Supply ───────────────────────────────────────────────────────────

  {
    id:       'gas_service_entry',
    type:     'valve',
    label:    'Gas Service Entry',
    position: { x: 0.59, y: 0.04 },   // northern boundary adjacent gas meter
    zoneId:   'utility.gas_meter',
    notes:    'Gas service entry + isolation valve — northern boundary wall. Landis+Gyr meter.',
  },
  {
    id:       'gas_hwu',
    type:     'hwu',
    label:    'Gas Hot Water Unit',
    position: { x: 0.76, y: 0.85 },   // centroid of garden.hot_water zone
    zoneId:   'garden.hot_water',
    notes:    'Gas-fired HWU on back fence, directly behind laundry. Heat pump upgrade candidate — see solar data.',
  },
  {
    id:       'gas_furnace',
    type:     'valve',
    label:    'Gas Ducted Furnace',
    position: { x: 0.60, y: 0.77 },   // centroid of utility.plant_room zone
    zoneId:   'utility.plant_room',
    notes:    'Gas ducted heating furnace — plant room, south of laundry. Supplies all indoor zones via duct runs.',
  },
  {
    id:       'gas_booster',
    type:     'hwu',
    label:    'HWU Booster',
    position: { x: 0.64, y: 0.77 },
    zoneId:   'utility.plant_room',
    notes:    'Gas booster for main hot water system. Plant room.',
  },
  {
    id:       'gas_run_main',
    type:     'pipe_run',
    label:    'Gas Main Run',
    position: { x: 0.62, y: 0.40 },   // approximate run from meter → laundry area
    zoneId:   'indoor.laundry',
    notes:    'Main gas pipe run from service entry (north) down to plant room + back fence HWU.',
  },

  // ── Water Supply ─────────────────────────────────────────────────────────

  {
    id:       'water_service_entry',
    type:     'meter',
    label:    'Water Meter',
    position: { x: 0.50, y: 0.04 },   // service entry zone
    zoneId:   'utility.service_entry',
    notes:    'Yarra Valley Water meter at street boundary. Ref: utility photos.',
  },
  {
    id:       'cold_water_main',
    type:     'pipe_run',
    label:    'Cold Water Main',
    position: { x: 0.56, y: 0.30 },
    zoneId:   null,
    notes:    'Cold water main run from service entry through house — exact routing TBC from plumbing drawings.',
  },

  // ── Drainage ─────────────────────────────────────────────────────────────

  {
    id:       'cellar_drain',
    type:     'drain',
    label:    'Cellar Drain',
    position: { x: 0.44, y: 0.88 },   // approximate cellar zone — below grade between back door + carport
    zoneId:   'outbuild.cellar',
    notes:    'Cellar drain — below grade. Monitor for flooding risk, particularly after pool pump operation.',
  },
  {
    id:       'laundry_drain',
    type:     'drain',
    label:    'Laundry Drain',
    position: { x: 0.615, y: 0.545 },
    zoneId:   'indoor.laundry',
    notes:    'Laundry floor waste + washing machine drain.',
  },
  {
    id:       'pool_fill',
    type:     'tap',
    label:    'Pool Fill',
    position: { x: 0.35, y: 0.80 },   // approximate pool zone
    zoneId:   'garden.l2_pool',
    notes:    'Pool water supply — manual fill tap. Integrate with irrigation controller for auto-top-up.',
  },

];

/** Convenience accessor for a single node by id */
export function getPlumbingNode(id: string): PlumbingNode | undefined {
  return PLUMBING_NODES.find(n => n.id === id);
}
