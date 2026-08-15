/**
 * PULSE — Semantic Colour Framework
 *
 * Colours derive from FIELD chamber frequencies.
 * This is the canonical mapping — not decoration.
 * Expression happens within these frequencies, not outside them.
 *
 * Frequency → Chamber → Semantic role → Colour
 */

export const FIELD_FREQUENCIES = {
  AKRON:         { hz: 396, name: 'Archive / Ground'       },
  ARKADAS:       { hz: 717, name: 'Bridge / Active'        },
  ATLAS:         { hz: 528, name: 'Navigation / Validation' },
  DOJO:          { hz: 741, name: 'Mind / Cognition'       },
  KINGS_CHAMBER: { hz: 852, name: 'Consciousness / Signal' },
  OBIWAN:        { hz: 963, name: 'Memory / Witness'       },
  TATA:          { hz: 432, name: 'Truth / Temporal'       },
} as const;

/**
 * Raw frequency colours — one source of truth.
 * Never assign these directly in components; use SENSOR_THEME below.
 */
export const FREQ_COLORS = {
  AKRON:         { primary: '#a33', dim: '#1a0a0a', border: '#3a1515' },
  ARKADAS:       { primary: '#fa6', dim: '#1a1000', border: '#3a2800' },
  ATLAS:         { primary: '#5c5', dim: '#0d1a0d', border: '#1a3a1a' },
  DOJO:          { primary: '#fd6', dim: '#1a1800', border: '#3a3000' },
  KINGS_CHAMBER: { primary: '#a6f', dim: '#100d1a', border: '#2a1a3a' },
  OBIWAN:        { primary: '#4af', dim: '#0d1a26', border: '#1a3a4a' },
  TATA:          { primary: '#55f', dim: '#0d0d1a', border: '#1a1a3a' },
} as const;

/**
 * Sensor → frequency assignment.
 * This is where semantic meaning is declared.
 *
 * BLE   = OBI-WAN  — wireless witness, sensing the field
 * GPS   = AKRON    — physical ground, earth anchor
 * WiFi  = ARKADAS  — active bridge, flow of connection
 * Metro = DOJO     — mind is awake, cognition loop live
 */
export const SENSOR_THEME = {
  BLE:   FREQ_COLORS.OBIWAN,
  GPS:   FREQ_COLORS.AKRON,
  WiFi:  FREQ_COLORS.ARKADAS,
  Metro: FREQ_COLORS.DOJO,
} as const;

/** Shared surface colours — not frequency-specific */
export const SURFACE = {
  background:  '#0a0a0a',
  card:        '#111',
  border:      '#1a1a2e',
  textPrimary: '#e0f0ff',
  textMuted:   '#557',
  textDim:     '#334',
} as const;
