/**
 * deviceRegistry — PULSE sovereign home registry
 * Mount Eliza · Susan Rich's house
 *
 * Every known device has a room/zone assignment and is observed over time.
 * Persists to AsyncStorage. Append-only observation log (never mutate history).
 *
 * Zone taxonomy:
 *   INDOOR_*  — rooms inside the main house
 *   OUTBUILD_* — separate structures (carport, backroom, cellar, storage)
 *   GARDEN_*  — garden levels 1–4 + back area
 *   SIDE_*    — side lawn zone
 *   FRONT_*   — driveway / gate / approach
 *   UTILITY_* — infrastructure nodes (pumps, tanks, meters)
 *
 * House construction (affects BLE signal propagation):
 *   - Cathedral ceiling, double brick, concrete slab
 *   - Ducted heating throughout (gas)
 *   - End Room is a timber-frame extension (different signal + thermal envelope)
 *   - Double brick + concrete = high RSSI attenuation across room boundaries
 *     → do not assume a device is "in" a room from a single strong reading;
 *       use avgRssi() over several scans before committing zone assignment
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Zone taxonomy ─────────────────────────────────────────────────────────────

export const ZONES = {
  // ── Indoor ──────────────────────────────────────────────────────────────────
  INDOOR_ENTRANCE_HALLWAY:   'indoor.entrance_hallway',
  INDOOR_STUDY_DEN:          'indoor.study_den',           // left of front entrance
  INDOOR_FORMAL_LOUNGE:      'indoor.formal_lounge',       // 5 steps down
  INDOOR_FORMAL_DINING:      'indoor.formal_dining',
  INDOOR_LAUNDRY:            'indoor.laundry',
  INDOOR_KITCHEN:            'indoor.kitchen',
  INDOOR_POWDER_ROOM:        'indoor.powder_room',         // guest toilet
  INDOOR_KITCHEN_DINING:     'indoor.kitchen_dining',      // kitchen table area
  INDOOR_FAMILY_ROOM:        'indoor.family_room',         // 5 stairs down from main — ducted heating INTAKE + thermostat; bedrooms are below this level
  INDOOR_CENTRAL_BATHROOM:   'indoor.central_bathroom',
  INDOOR_MASTER_BEDROOM:     'indoor.master_bedroom',      // below family room level — ducted heating vent
  INDOOR_MASTER_DRESSING:    'indoor.master_dressing',
  INDOOR_MASTER_ENSUITE:     'indoor.master_ensuite',
  INDOOR_SAUNA:              'indoor.sauna',
  INDOOR_BEDROOM_2:          'indoor.bedroom_2',           // ducted heating vent
  INDOOR_BEDROOM_3:          'indoor.bedroom_3',           // walk-through — ducted heating vent
  INDOOR_BEDROOM_4:          'indoor.bedroom_4',           // walk-through — ducted heating vent
  INDOOR_END_ROOM:           'indoor.end_room',            // 1 step down, far end of bedroom wing — TIMBER FRAME on stumps (NOT the Backroom)
  INDOOR_BATHROOM:           'indoor.bathroom',            // near end room

  // ── Outbuildings / transitional ─────────────────────────────────────────────
  OUTBUILD_CARPORT:          'outbuild.carport',           // open zone connecting main house, backroom, storage
  OUTBUILD_STORAGE:          'outbuild.storage',           // 2.5 × 2.5 m
  OUTBUILD_BACKROOM:         'outbuild.backroom',          // NE corner of block, near carport, 3 steps up — SEPARATE outbuilding, large, games/utility + terrace
  OUTBUILD_CELLAR:           'outbuild.cellar',            // between carport and back door

  // ── Front approach ──────────────────────────────────────────────────────────
  FRONT_GATE:                'front.gate',                 // road side, letterbox, no power
  FRONT_DRIVEWAY:            'front.driveway',             // battle-axe block
  FRONT_ELECTRIC_GATE:       'front.electric_gate',        // halfway up drive, radio + cat6
  FRONT_DRIVEWAY_LIGHTS:     'front.driveway_lights',      // sensor set

  // ── Garden levels ───────────────────────────────────────────────────────────
  GARDEN_TERRACE:            'garden.terrace',             // in front of kitchen dining
  GARDEN_BACK_TERRACE:       'garden.back_terrace',        // small terrace between kitchen and family room
  GARDEN_CLOTHESLINE:        'garden.clothesline',         // along back fence
  GARDEN_HOT_WATER:          'garden.hot_water',           // hot water unit, back fence
  GARDEN_AC:                 'garden.ac',                  // AC unit(s), back fence
  GARDEN_BACK_WALKWAY:       'garden.back_walkway',        // paved walkway along back of house to carport
  GARDEN_L1_LOWER_TERRACE:   'garden.l1_lower_terrace',    // below terrace; outdoor access formal lounge + master
  GARDEN_L2_POOL:            'garden.l2_pool',             // swimming pool + BBQ + lawns
  GARDEN_L2_BBQ:             'garden.l2_bbq',
  GARDEN_L3_POOL_HOUSE:      'garden.l3_pool_house',       // old pool house near BBQ, below pool
  GARDEN_L4_ROSE_GARDEN:     'garden.l4_rose_garden',
  GARDEN_L4_GLASSHOUSE:      'garden.l4_glasshouse',
  GARDEN_L4_SHED:            'garden.l4_shed',             // small garden shed

  // ── Side lawn (south, past End Room) ────────────────────────────────────────
  SIDE_LAWN:                 'side.lawn',
  SIDE_AVIARY:               'side.aviary',                // old aviary, lower area, adj water tank

  // ── Utility / infrastructure nodes ──────────────────────────────────────────
  UTILITY_POOL_PUMPS:        'utility.pool_pumps',
  UTILITY_IRRIGATION_HEADER: 'utility.irrigation_header',  // header tank, garden L4
  UTILITY_WATER_TANK:        'utility.water_tank',         // 100,000 L, side lawn / near glasshouse
  UTILITY_MAIN_WATER_METER:  'utility.main_water_meter',   // inside block, near title boundary
  UTILITY_SERVICE_ENTRY:     'utility.service_entry',      // north wall (carport side) — gas + elec + Telstra entry points
  UTILITY_ELECTRIC_METER:    'utility.electric_meter',     // north wall exterior
  UTILITY_GAS_METER:         'utility.gas_meter',          // north wall exterior
  UTILITY_SOLAR_INVERTER:    'utility.solar_inverter',     // 21 kVA 3-phase, behind wooden screen near front door (north wall)
  UTILITY_PLANT_ROOM:        'utility.plant_room',         // adj to laundry (south wall) — gas furnace + hot water booster
  UTILITY_HOT_WATER_UNIT:    'utility.hot_water_unit',     // gas HWU on back fence, behind laundry
  UTILITY_DUCTED_HEATING:    'utility.ducted_heating',     // gas ducted system, whole house (not end room)
} as const;

// ─── House construction metadata ───────────────────────────────────────────────

export const HOUSE_METADATA = {
  address:       '10 Watts Parade, Mount Eliza, VIC',
  // 1988 renovation plans: Christopher Lawrence Interiors, for Mr. & Mrs. J. Rich
  construction:  'double brick, concrete slab, cathedral ceiling',
  heating:       'gas ducted (whole house excl. End Room) — intake + thermostat in Family Room',
  bleAttenuation: 'HIGH — double brick walls significantly attenuate BLE signal across room boundaries; require avgRssi over ≥5 scans before zone assignment',
  zones: {
    // End Room = timber extension at far end of the bedroom wing (indoor, 1 step down)
    // This is NOT the Backroom. The Backroom is a separate NE outbuilding near the carport.
    'indoor.end_room': {
      construction:   'timber frame on stumps (stumps at 1500mm centres, pine lining, hardwood floor)',
      heating:        'none — not served by ducted system',
      bleAttenuation: 'LOW — timber walls; signal bleeds between End Room and adjacent zones',
    },
    // Backroom = separate outbuilding, NE corner, near carport, 3 steps up, games/utility
    // Known limitation: NO plumbing — no bathroom or toilet
    // Future potential: self-contained staff/care residence (requires plumbing addition)
    // PULSE relevance: if carer/staff occupies this zone, needs independent device + presence monitoring
    'outbuild.backroom': {
      construction:   'separate outbuilding — NE corner of block',
      heating:        'unknown',
      plumbing:       'NONE — no bathroom or toilet; major constraint for independent habitation',
      futureUse:      'potential staff/care residence — plumbing addition required first',
      bleAttenuation: 'MEDIUM — separate structure, assess independently',
    },
    // Cellar = between back door and backroom, triangle with carport as third point
    // 4–5 steps DOWN, sunk into ground — essentially a large concrete pipe
    // Interior: shelving + light. Thermally stable (below-grade concrete).
    // Potential: server room, wine storage, meat curing — all benefit from stable cool temp
    'outbuild.cellar': {
      construction:   'below-grade concrete pipe — sunk into ground, 4–5 steps down',
      heating:        'none — naturally cool, thermally stable',
      plumbing:       'unknown',
      bleAttenuation: 'HIGH — below-grade concrete; likely BLE dead zone; wire/WiFi preferred for any server use',
      futureUse:      'server room candidate (thermally ideal) | wine storage | meat curing',
    },
    // Laundry — also houses key infrastructure
    'indoor.laundry': {
      contains: 'main power board (consumer mains) | security system panel | house router (primary LAN)',
      note:     'Network and power hub for the house — high-value zone for PULSE monitoring',
    },
    // Plant room — adjacent to laundry on south side
    'utility.plant_room': {
      construction:   'internal room, south of laundry',
      contains:       'gas furnace (ducted heating unit) | hot water booster',
      heating:        'n/a — mechanical room',
      bleAttenuation: 'MEDIUM — internal masonry',
    },
    // Service entry — north wall exterior, other side of carport wall
    'utility.service_entry': {
      location: 'north boundary wall exterior (carport side)',
      contains: 'gas meter | electricity meter | Telstra/NBN entry point',
    },
    // Solar inverter — north wall near front door, behind wooden privacy screen
    'utility.solar_inverter': {
      location: 'north wall, near front door, behind wooden screen',
      spec:     '21 kVA, 3-phase',
      note:     '3-phase at 21kVA is commercial-grade — significant export or self-consumption capacity',
    },
    // Hot water unit — gas, back fence almost directly behind laundry
    'utility.hot_water_unit': {
      location: 'back fence, behind laundry',
      fuel:     'gas (candidate for heat pump replacement)',
    },
  },
} as const;

export type ZoneId = typeof ZONES[keyof typeof ZONES];

// Human-readable labels for UI display
export const ZONE_LABELS: Record<ZoneId, string> = {
  'indoor.entrance_hallway':   'Entrance Hallway',
  'indoor.study_den':          'Study / Den',
  'indoor.formal_lounge':      'Formal Lounge',
  'indoor.formal_dining':      'Formal Dining Room',
  'indoor.laundry':            'Laundry',
  'indoor.kitchen':            'Kitchen',
  'indoor.powder_room':        'Powder Room',
  'indoor.kitchen_dining':     'Kitchen Dining',
  'indoor.family_room':        'Family Room',
  'indoor.central_bathroom':   'Central Bathroom',
  'indoor.master_bedroom':     'Master Bedroom',
  'indoor.master_dressing':    'Master Dressing Room',
  'indoor.master_ensuite':     'Master Ensuite',
  'indoor.sauna':              'Sauna',
  'indoor.bedroom_2':          'Bedroom 2',
  'indoor.bedroom_3':          'Bedroom 3',
  'indoor.bedroom_4':          'Bedroom 4',
  'indoor.end_room':           'End Room',
  'indoor.bathroom':           'Bathroom',
  'outbuild.carport':          'Carport',
  'outbuild.storage':          'Storage Room',
  'outbuild.backroom':         'Backroom / Games Room',
  'outbuild.cellar':           'Cellar',
  'front.gate':                'Front Gate',
  'front.driveway':            'Driveway',
  'front.electric_gate':       'Electric Gate',
  'front.driveway_lights':     'Driveway Lights',
  'garden.terrace':            'Terrace',
  'garden.back_terrace':       'Back Terrace (Kitchen–Family)',
  'garden.clothesline':        'Clothesline',
  'garden.hot_water':          'Hot Water Unit',
  'garden.ac':                 'AC Unit (Back Fence)',
  'garden.back_walkway':       'Back Walkway (House → Carport)',
  'garden.l1_lower_terrace':   'Garden · Lower Terrace',
  'garden.l2_pool':            'Garden · Pool',
  'garden.l2_bbq':             'Garden · BBQ Area',
  'garden.l3_pool_house':      'Garden · Pool House',
  'garden.l4_rose_garden':     'Garden · Rose Garden',
  'garden.l4_glasshouse':      'Garden · Glasshouse',
  'garden.l4_shed':            'Garden · Shed',
  'side.lawn':                 'Side Lawn',
  'side.aviary':               'Aviary',
  'utility.pool_pumps':        'Pool Pumps',
  'utility.irrigation_header': 'Irrigation Header Tank',
  'utility.water_tank':        'Water Tank (100,000 L)',
  'utility.main_water_meter':  'Main Water Meter',
  'utility.electric_meter':    'Electricity Meter',
  'utility.gas_meter':         'Gas Meter',
  'utility.service_entry':     'Service Entry (Gas + Elec + Telstra)',
  'utility.solar_inverter':    'Solar Inverter (21kVA 3-phase)',
  'utility.plant_room':        'Plant Room',
  'utility.hot_water_unit':    'Hot Water Unit (Gas)',
  'utility.ducted_heating':    'Ducted Heating System',
};

// ─── Known infrastructure gaps / future projects ──────────────────────────────

export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectStatus   = 'identified' | 'scoped' | 'in_progress' | 'done';

export interface HouseProject {
  id:          string;
  name:        string;
  zone:        ZoneId | null;
  priority:    ProjectPriority;
  status:      ProjectStatus;
  description: string;
  blockedBy:   string | null;   // what must happen first
  pulseRole:   string | null;   // how PULSE helps once resolved
}

export const KNOWN_PROJECTS: HouseProject[] = [
  {
    id:          'project.backroom_plumbing',
    name:        'Backroom — Add Plumbing (Bathroom + Toilet)',
    zone:        ZONES.OUTBUILD_BACKROOM,
    priority:    'high',
    status:      'identified',
    description: 'No plumbing currently in backroom. Large NE outbuilding is otherwise a strong candidate for a self-contained staff or care residence. Requires at minimum: toilet, shower/bathroom, basin. Connection to main sewer or septic.',
    blockedBy:   'Council approval + plumbing works',
    pulseRole:   'Once habitable: independent presence detection, environment monitoring, emergency alert for carer/resident',
  },
  {
    id:          'project.heating_replacement',
    name:        'Ducted Heating — Replace Gas with Electric',
    zone:        ZONES.INDOOR_FAMILY_ROOM,
    priority:    'high',
    status:      'identified',
    description: 'Gas ducted heating system installed 1988. Thermostat in Family Room but bedrooms served are below — cold floor gap. Replace with electric reverse-cycle (VIC rebates available). Complications: concrete slab, cathedral ceilings, existing ductwork.',
    blockedBy:   'System design — how to route new system through slab/ceilings',
    pulseRole:   'Monitor zone-by-zone temperatures to quantify thermostat gap before and after replacement; build evidence for system specification',
  },
  {
    id:          'project.cellar_server_room',
    name:        'Cellar — Evaluate as Server Room / Climate Store',
    zone:        ZONES.OUTBUILD_CELLAR,
    priority:    'medium',
    status:      'identified',
    description: 'Below-grade concrete pipe structure, 4–5 steps down, between back door and backroom (triangle with carport). Naturally cool and thermally stable — ideal passive cooling for server hardware and for wine/meat curing. No active heating. BLE likely dead zone; any network gear would need wired ethernet or WiFi AP.',
    blockedBy:   'Power circuit assessment — need to confirm what load the cellar circuit can support',
    pulseRole:   'Temperature + humidity sensor (wired or WiFi); alert on exceedance of curing/server range; log thermal profile over seasons to confirm stability',
  },
  {
    id:          'project.solar_monitoring',
    name:        'Solar System — PULSE Integration (21 kVA 3-phase)',
    zone:        ZONES.UTILITY_SOLAR_INVERTER,
    priority:    'high',
    status:      'identified',
    description: '21 kVA 3-phase solar inverter installed (north wall, wooden screen). Commercial-grade capacity. Current monitoring status unknown — likely no live visibility into generation, export, or self-consumption. Pairs with hot water heat pump opportunity and potential battery addition.',
    blockedBy:   'Identify inverter make/model + comms protocol (Modbus, SunSpec, proprietary API)',
    pulseRole:   'Live generation + export + self-consumption monitoring; correlate with hot water, heating, and irrigation loads; alert on underperformance vs expected yield',
  },
  {
    id:          'project.irrigation_fault',
    name:        'Irrigation — Fault Investigation (High Water Bill)',
    zone:        ZONES.UTILITY_IRRIGATION_HEADER,
    priority:    'critical',
    status:      'identified',
    description: 'Water bill elevated. 100,000L tank on side lawn. Irrigation header tank in garden L4. Likely fault or leak in irrigation system. Needs audit of all irrigation zones and valve operation.',
    blockedBy:   null,
    pulseRole:   'Water meter monitoring + irrigation valve state → pinpoint fault zone; alert on anomalous flow outside schedule',
  },
];

// ─── House system record (non-BLE infrastructure + garden systems) ─────────────

export type SystemCategory =
  | 'heating'
  | 'cooling'
  | 'hot_water'
  | 'irrigation'
  | 'pool'
  | 'electrical'
  | 'gas'
  | 'water'
  | 'security'
  | 'garden'
  | 'lighting'
  | 'audio';

export type SystemStatus = 'unknown' | 'ok' | 'fault' | 'off' | 'running';

export interface HouseSystem {
  id:          string;
  name:        string;
  category:    SystemCategory;
  zone:        ZoneId | null;       // primary zone (e.g. intake in family room)
  zones:       ZoneId[];            // all zones this system serves
  status:      SystemStatus;
  notes:       string | null;
  lastChecked: string | null;       // ISO timestamp
}

// Seed — known systems at Mount Eliza
export const KNOWN_SYSTEMS: HouseSystem[] = [
  {
    id:          'heating.ducted',
    name:        'Ducted Heating (Gas)',
    category:    'heating',
    zone:        ZONES.INDOOR_FAMILY_ROOM,
    zones:       [
      ZONES.INDOOR_FAMILY_ROOM,
      ZONES.INDOOR_MASTER_BEDROOM,
      ZONES.INDOOR_BEDROOM_2,
      ZONES.INDOOR_BEDROOM_3,
      ZONES.INDOOR_BEDROOM_4,
    ],
    status:      'unknown',
    notes:       'Intake + thermostat in Family Room. Bedrooms served are below thermostat level — known cold-floor gap. Candidate for electric reverse-cycle ducted replacement (rebate eligible).',
    lastChecked: null,
  },
  {
    id:          'cooling.ac_back',
    name:        'Split System AC (Back Fence)',
    category:    'cooling',
    zone:        ZONES.GARDEN_AC,
    zones:       [ZONES.GARDEN_AC],
    status:      'unknown',
    notes:       'External units along back fence. Indoor heads — zones not yet confirmed.',
    lastChecked: null,
  },
  {
    id:          'hot_water.unit',
    name:        'Hot Water Unit',
    category:    'hot_water',
    zone:        ZONES.GARDEN_HOT_WATER,
    zones:       [ZONES.GARDEN_HOT_WATER],
    status:      'unknown',
    notes:       'Located along back fence.',
    lastChecked: null,
  },
  {
    id:          'pool.pumps',
    name:        'Pool Pumps',
    category:    'pool',
    zone:        ZONES.UTILITY_POOL_PUMPS,
    zones:       [ZONES.UTILITY_POOL_PUMPS, ZONES.GARDEN_L2_POOL],
    status:      'unknown',
    notes:       'Garden Level 4 near BBQ area.',
    lastChecked: null,
  },
  {
    id:          'irrigation.main',
    name:        'Irrigation System',
    category:    'irrigation',
    zone:        ZONES.UTILITY_IRRIGATION_HEADER,
    zones:       [
      ZONES.UTILITY_IRRIGATION_HEADER,
      ZONES.UTILITY_WATER_TANK,
      ZONES.GARDEN_L1_LOWER_TERRACE,
      ZONES.GARDEN_L2_POOL,
      ZONES.GARDEN_L3_POOL_HOUSE,
      ZONES.GARDEN_L4_ROSE_GARDEN,
      ZONES.GARDEN_L4_GLASSHOUSE,
      ZONES.SIDE_LAWN,
    ],
    status:      'unknown',
    notes:       'Header tank at Garden L4. 100,000L water tank on side lawn. Known issues: irrigation faults, high water bill. Zones and circuits not yet mapped.',
    lastChecked: null,
  },
  {
    id:          'garden.microcosmos',
    name:        'Garden Microcosmos',
    category:    'garden',
    zone:        null,
    zones:       [
      ZONES.GARDEN_L1_LOWER_TERRACE,
      ZONES.GARDEN_L2_POOL,
      ZONES.GARDEN_L3_POOL_HOUSE,
      ZONES.GARDEN_L4_ROSE_GARDEN,
      ZONES.GARDEN_L4_GLASSHOUSE,
      ZONES.GARDEN_L4_SHED,
      ZONES.SIDE_LAWN,
      ZONES.SIDE_AVIARY,
    ],
    status:      'unknown',
    notes:       'Multi-level garden. Currently overgrown. Planned: soil moisture sensors, sunlight/imagery analysis per zone, irrigation circuit mapping. Optimal state is iterative — system learns from observation.',
    lastChecked: null,
  },
  {
    id:          'electrical.gate',
    name:        'Electric Gate',
    category:    'security',
    zone:        ZONES.FRONT_ELECTRIC_GATE,
    zones:       [ZONES.FRONT_ELECTRIC_GATE, ZONES.FRONT_DRIVEWAY],
    status:      'unknown',
    notes:       'Halfway up driveway. Radio controller + cat6 cable ready. Camera integration pending.',
    lastChecked: null,
  },
  {
    id:          'water.main',
    name:        'Main Water Supply',
    category:    'water',
    zone:        ZONES.UTILITY_MAIN_WATER_METER,
    zones:       [ZONES.UTILITY_MAIN_WATER_METER],
    status:      'unknown',
    notes:       'Meter inside block near title boundary. Known issue: high water bill — likely irrigation fault or leak.',
    lastChecked: null,
  },
  {
    id:          'electrical.solar',
    name:        'SOFAR Solar Inverter (21 kVA 3-phase)',
    category:    'electrical',
    zone:        ZONES.UTILITY_SOLAR_INVERTER,
    zones:       [ZONES.UTILITY_SOLAR_INVERTER, ZONES.UTILITY_SERVICE_ENTRY],
    status:      'unknown',
    // Confirmed from photo survey (IMG_1077–1087):
    // Brand: SOFAR Solar | Type: Hybrid (BAT1+BAT2 inputs = battery-ready)
    // Output: 3-phase (R/S/T ~233–240V, ~49.98Hz) | Capacity: ~21 kVA
    // PV: OC Voltage 397.2V, Short Circuit 20.96A
    // Observed live export: ~4kW across 3 phases (IMG_1082)
    // Comms options: Modbus RS485 (RJ45 port on unit) OR SolarmanV5 over LAN (WiFi dongle)
    // Python lib: pysolarmanv5 — no cloud dependency
    // Battery slot: BAT1/BAT2 present — battery storage not yet installed
    // WiFi dongle: not confirmed in photos — verify before SolarmanV5 setup
    notes:       'SOFAR Solar hybrid 3-phase ~21kVA inverter. Battery-ready (BAT1/BAT2). Comms via Modbus RS485 or SolarmanV5 (pysolarmanv5). Verify WiFi dongle on unit.',
    lastChecked: null,
  },
  {
    id:          'electrical.gas_meter',
    name:        'Gas Meter (Landis+Gyr)',
    category:    'gas',
    zone:        ZONES.UTILITY_GAS_METER,
    zones:       [ZONES.UTILITY_GAS_METER, ZONES.UTILITY_SERVICE_ENTRY],
    status:      'unknown',
    // Confirmed from photo survey (IMG_1111–1115):
    // Brand: Landis+Gyr | Type: Diaphragm gas meter (large grey industrial body)
    // Reading: ~026312890 (confirm units: MJ or m³ — check certification label)
    // Regulator: yellow cap (pressure test), red cap (valve) — standard AU gas assembly
    // No smart interface visible — pulse output may be available on meter body
    // Options: (1) request smart meter from gas retailer, (2) install pulse counter
    notes:       'Landis+Gyr diaphragm gas meter. Reading ~026312890 (units TBC). No smart comms — request smart meter or fit pulse counter for PULSE integration.',
    lastChecked: null,
  },
  {
    id:          'gas.plant_room',
    name:        'Plant Room (Gas Furnace + HWU Booster)',
    category:    'heating',
    zone:        ZONES.UTILITY_PLANT_ROOM,
    zones:       [ZONES.UTILITY_PLANT_ROOM, ZONES.INDOOR_LAUNDRY],
    status:      'unknown',
    notes:       'Adjacent to laundry on south side. Contains gas furnace (ducted heating unit) and hot water booster. PULSE: monitor flue temp, ambient, gas usage via meter pulse counter.',
    lastChecked: null,
  },
  {
    id:          'hot_water.gas_unit',
    name:        'Gas Hot Water Unit (Back Fence)',
    category:    'hot_water',
    zone:        ZONES.UTILITY_HOT_WATER_UNIT,
    zones:       [ZONES.UTILITY_HOT_WATER_UNIT],
    status:      'unknown',
    notes:       'Gas unit on back fence, almost directly behind laundry. Candidate for heat pump replacement (pairs with 21kVA solar). Booster is in plant room.',
    lastChecked: null,
  },
  {
    id:          'audio.beoplay8',
    name:        'Bang & Olufsen BeoPlay 8',
    category:    'audio',
    zone:        null,                // zone not yet confirmed — needs placement survey
    zones:       [],
    status:      'unknown',
    // Confirmed from photo survey (IMG_1566–1568):
    // Brand: Bang & Olufsen | Model: BeoPlay 8
    // MAC: 00-07-F5-26-C3-84 | Serial: 22849984 | Pin: 00392831
    // Connectivity: WiFi (confirmed on label) + Lightning dock
    // Config URL: http://169.254.11.22 (link-local — direct connection mode)
    // B&O Mozart API: open-sourced — LAN control, no cloud required
    // Placement: position modes = FREE / WALL / CORNER (per setup card IMG_1568)
    notes:       'B&O BeoPlay 8. MAC 00-07-F5-26-C3-84. WiFi+Lightning. Integrate via Mozart API (LAN, no cloud). Config: http://169.254.11.22. Zone not yet confirmed.',
    lastChecked: null,
  },
  {
    id:          'audio.samsung_tv_den',
    name:        'Samsung Smart TV (Study/Den)',
    category:    'audio',
    zone:        'indoor.study_den',
    zones:       ['indoor.study_den'],
    status:      'unknown',
    // Confirmed by JB: Samsung smart TV, Study/Den — Susan's room.
    // AirPlay 2 CONFIRMED: TV already approved as AirPlay receiver in Apple ecosystem
    // (Samsung TVs 2019+ support AirPlay 2 natively — no Apple hardware required).
    //
    // Integration path (sovereign, LAN, no cloud required):
    //   PRIMARY:  AirPlay 2 — cast PULSE-web spatial map directly from Safari/Chrome
    //             on any Apple device on the same LAN. Zero config needed — already approved.
    //   SECONDARY: Tizen REST API (LAN) — programmatic control if deeper integration needed
    //   AVOID:    SmartThings (cloud-dependent, violates sovereignty)
    //
    // PULSE dashboard demo plan:
    //   1. Open PULSE-web on phone/tablet
    //   2. AirPlay → Samsung TV in den
    //   3. Susan sees spatial map on the big screen — warm isometric or flat plan veneer
    //
    // TODO: confirm Samsung model year (2019+ = AirPlay 2 certain; note serial/model label)
    notes:       'Samsung Smart TV, Study/Den. AirPlay 2 confirmed (approved in Apple ecosystem). PRIMARY integration: AirPlay cast from PULSE-web — sovereign, LAN, no cloud. Demo: cast spatial map to TV for Susan.',
    lastChecked: null,
  },
  {
    id:          'av.appletv_end_room',
    name:        'Apple TV (End Room)',
    category:    'audio',
    zone:        'indoor.end_room',
    zones:       ['indoor.end_room'],
    status:      'unknown',
    // Modern Apple TV — confirmed by JB to have memory + HD storage (Apple TV 4K gen 2/3,
    // A15 chip, 64–128 GB). Ethernet + WiFi. Runs tvOS.
    // Integration:
    //   NATIVE: PULSE-tvOS app (tvOS target in monorepo) — best experience, full control
    //   AIRPLAY: PULSE-web can AirPlay to this device — works today, zero config
    // The End Room is timber frame (low BLE attenuation) — good BLE anchor point.
    notes:       'Apple TV 4K (modern, A15). End Room timber frame. PRIMARY: PULSE-tvOS native app. AIRPLAY: PULSE-web cast works today. Good BLE anchor (timber = low attenuation).',
    lastChecked: null,
  },
  {
    id:          'av.appletv_family_room',
    name:        'Apple TV (Family Room)',
    category:    'audio',
    zone:        'indoor.family_room',
    zones:       ['indoor.family_room'],
    status:      'unknown',
    // Older Apple TV (HD or earlier 4K gen) — connected to Sony Bravia LCD.
    // Sony Bravia NOT connected to internet — Apple TV is the only smart layer.
    // Sonos Ray connected via OPTICAL CABLE from Apple TV (or TV optical out).
    // Integration:
    //   AIRPLAY: PULSE-web can AirPlay to this device today
    //   NATIVE: PULSE-tvOS app runs on this too (lighter render profile for older HW)
    //   SONOS: Ray is controlled separately via Sonos LAN API (sovereign, no cloud required)
    notes:       'Apple TV (older gen), Family Room. Sony Bravia LCD (no internet — Apple TV only smart layer). Sonos Ray on optical. AirPlay works today. PULSE-tvOS target.',
    lastChecked: null,
  },
  {
    id:          'av.sony_bravia_family_room',
    name:        'Sony Bravia LCD (Family Room)',
    category:    'audio',
    zone:        'indoor.family_room',
    zones:       ['indoor.family_room'],
    status:      'unknown',
    // Sony Bravia LCD TV — NOT connected to internet. Dumb display layer.
    // All smarts come from the Apple TV connected to it.
    // Audio routed via optical cable to Sonos Ray.
    // No direct PULSE integration needed — Apple TV handles display, Sonos handles audio.
    notes:       'Sony Bravia LCD, Family Room. Not internet-connected — display layer only. Controlled via Apple TV (AirPlay). Audio → Sonos Ray (optical cable).',
    lastChecked: null,
  },
  {
    id:          'av.sonos_ray_family_room',
    name:        'Sonos Ray (Family Room)',
    category:    'audio',
    zone:        'indoor.family_room',
    zones:       ['indoor.family_room'],
    status:      'unknown',
    // Sonos Ray soundbar — connected via optical cable to Sony Bravia / Apple TV optical out.
    // Sonos devices expose a full LAN REST API (sovereign, no cloud required):
    //   Discovery:  mDNS / Bonjour (_sonos._tcp)
    //   Control:    Sonos Local Control API (HTTP + WebSocket, LAN only)
    // PULSE integration: sovereign Sonos LAN API — play tones/alerts, read playback state,
    // trigger room-aware audio events (e.g. alert tone when security zone breached).
    notes:       'Sonos Ray, Family Room. Optical cable from Apple TV. Sovereign LAN API (mDNS discovery, HTTP+WS control). PULSE: S2 media server running on Ray, used as distributed computational coordinator.',
    lastChecked: null,
  },
  {
    id:          'audio.polk_soundbar',
    name:        'Polk Magnifi Soundbar',
    category:    'audio',
    zone:        'indoor.end_room',
    zones:       ['indoor.end_room'],
    status:      'unknown',
    notes:       'End room soundbar. Google Cast Native.',
    lastChecked: null,
  },
  {
    id:          'audio.sonos_five',
    name:        'Sonos Five (End Room)',
    category:    'audio',
    zone:        'indoor.end_room',
    zones:       ['indoor.end_room'],
    status:      'unknown',
    notes:       'End room heavy speaker on legacy S1.',
    lastChecked: null,
  },
];

// ─── Home device record ────────────────────────────────────────────────────────

export interface HomeDevice {
  id:           string;         // BLE device ID
  name:         string | null;
  zone:         ZoneId | null;  // null = zone not yet assigned
  firstSeen:    string;         // ISO timestamp
  lastSeen:     string;
  rssiHistory:  number[];       // last 20 readings
  aligned:      boolean;        // has been explicitly registered by user
  notes:        string | null;
}

// ─── Observation entry ─────────────────────────────────────────────────────────

export type TreatyEnvelope = 'Observed' | 'Interpretation' | 'Recommendation' | 'Unknown';

export interface Observation {
  anchorId: string;
  deviceId: string;
  timestamp: string;
  rssi: number | null;
  witnessId: string;
  envelope: TreatyEnvelope;
  event: 'seen' | 'unaligned_flagged' | 'registered' | 'zone_assigned' | 'target_state';
  payload?: Record<string, any>;
}

// ─── Storage keys ──────────────────────────────────────────────────────────────

const KEY_DEVICES      = '@pulse:devices';
const KEY_OBSERVATIONS = '@pulse:observations';

// ─── In-memory cache ───────────────────────────────────────────────────────────

let _devices:      Map<string, HomeDevice> = new Map();
let _observations: Observation[]           = [];
let _loaded = false;

async function load(): Promise<void> {
  if (_loaded) return;
  try {
    const [devRaw, obsRaw] = await Promise.all([
      AsyncStorage.getItem(KEY_DEVICES),
      AsyncStorage.getItem(KEY_OBSERVATIONS),
    ]);
    if (devRaw) {
      const arr: HomeDevice[] = JSON.parse(devRaw);
      arr.forEach(d => _devices.set(d.id, d));
    }
    if (obsRaw) {
      _observations = JSON.parse(obsRaw);
    }
  } catch (_) {}
  _loaded = true;
}

async function persist(): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_DEVICES, JSON.stringify(Array.from(_devices.values()))),
    AsyncStorage.setItem(KEY_OBSERVATIONS, JSON.stringify(_observations.slice(-2000))),
  ]);
}

function appendObs(entry: Observation): void {
  _observations.push(entry);
  // keep last 2000 in memory
  if (_observations.length > 2000) _observations.splice(0, _observations.length - 2000);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Call once at app start before using any other registry methods */
export async function initRegistry(): Promise<void> {
  await load();
}

/** Log a sighting — creates record if first time seen */
export async function observe(
  id:   string,
  name: string | null,
  rssi: number | null,
): Promise<void> {
  await load();
  const now = new Date().toISOString();
  const existing = _devices.get(id);

  if (existing) {
    existing.lastSeen = now;
    if (name && !existing.name) existing.name = name;
    if (rssi !== null) {
      existing.rssiHistory.push(rssi);
      if (existing.rssiHistory.length > 20) existing.rssiHistory.shift();
    }
    _devices.set(id, existing);
  } else {
    _devices.set(id, {
      id,
      name,
      zone:        null,
      firstSeen:   now,
      lastSeen:    now,
      rssiHistory: rssi !== null ? [rssi] : [],
      aligned:     false,
      notes:       null,
    });
  }

  appendObs({ anchorId: 'obs-' + Date.now() + '-' + Math.floor(Math.random()*1000), witnessId: 'pulse-local-hub', envelope: 'Observed', deviceId: id, timestamp: now, rssi, event: 'seen' });
  await persist();
}

/** Flag a device as unaligned — triggers ambient alert in UI */
export async function flagUnaligned(
  id:   string,
  rssi: number | null,
): Promise<void> {
  await load();
  const now = new Date().toISOString();
  appendObs({ anchorId: 'obs-' + Date.now() + '-' + Math.floor(Math.random()*1000), witnessId: 'pulse-local-hub', envelope: 'Interpretation', deviceId: id, timestamp: now, rssi, event: 'unaligned_flagged' });
  await persist();
}

/** Register a device — mark aligned, assign zone, add notes */
export async function register(
  id:    string,
  zone:  ZoneId,
  notes: string | null = null,
): Promise<void> {
  await load();
  const now = new Date().toISOString();
  const existing = _devices.get(id);

  if (existing) {
    existing.zone    = zone;
    existing.aligned = true;
    if (notes) existing.notes = notes;
    existing.lastSeen = now;
    _devices.set(id, existing);
  }

  appendObs({ anchorId: 'obs-' + Date.now() + '-' + Math.floor(Math.random()*1000), witnessId: 'pulse-local-hub', envelope: 'Interpretation', deviceId: id, timestamp: now, rssi: null, event: 'registered' });
  await persist();
}

/** Assign a zone to an already-known device */
export async function assignZone(id: string, zone: ZoneId): Promise<void> {
  await load();
  const now = new Date().toISOString();
  const existing = _devices.get(id);
  if (existing) {
    existing.zone = zone;
    existing.lastSeen = now;
    _devices.set(id, existing);
    appendObs({ anchorId: 'obs-' + Date.now() + '-' + Math.floor(Math.random()*1000), witnessId: 'pulse-local-hub', envelope: 'Interpretation', deviceId: id, timestamp: now, rssi: null, event: 'zone_assigned' });
    await persist();
  }
}

/** Look up a known device */
export function lookup(id: string): HomeDevice | undefined {
  return _devices.get(id);
}

/** All known devices */
export function allDevices(): HomeDevice[] {
  return Array.from(_devices.values());
}

/** Devices with no zone assignment */
export function unzoned(): HomeDevice[] {
  return allDevices().filter(d => d.zone === null);
}

/** Devices not yet aligned (unregistered) */
export function unaligned(): HomeDevice[] {
  return allDevices().filter(d => !d.aligned);
}

/** Recent observations, newest first */
export function recentObservations(limit = 50): Observation[] {
  return _observations.slice(-limit).reverse();
}

/** Average RSSI over last N readings */
export function avgRssi(id: string, n = 5): number | null {
  const d = _devices.get(id);
  if (!d || d.rssiHistory.length === 0) return null;
  const slice = d.rssiHistory.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
