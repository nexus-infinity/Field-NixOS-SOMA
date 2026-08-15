/**
 * SpatialRenderer — Veneer switcher + layer toggle hub
 *
 * Sits above all veneer components. Responsibilities:
 *   1. Measure own layout → supply width/height to active veneer
 *   2. Render the active veneer (FlatPlanVeneer or a phase-guarded stub)
 *   3. Layer toggle bar — scrollable pill row, top overlay
 *   4. Veneer switcher   — segmented tab bar, bottom overlay
 *
 * Parent passes all data (zones, pins, layer nodes).
 * This component owns: which veneer is active, which layers are on.
 */

import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FlatPlanVeneer } from './veneers/FlatPlanVeneer';
import { IsometricVeneer } from './veneers/IsometricVeneer';
import {
  LAYER_LABELS,
  VENEER_LABELS,
  VENEER_LAYER_SUPPORT,
  type LayerId,
  type SpatialMapProps,
  type VeneerId,
} from './SpatialTypes';

// ─── Stub renderer for veneers not yet implemented ────────────────────────────

function StubVeneer({
  veneer,
  width,
  height,
}: {
  veneer: VeneerId;
  width: number;
  height: number;
}) {
  return (
    <View style={[styles.stub, { width, height }]}>
      <Text style={styles.stubTitle}>{VENEER_LABELS[veneer]}</Text>
      <Text style={styles.stubSub}>Coming in a future phase</Text>
    </View>
  );
}

// ─── SpatialRenderer props ────────────────────────────────────────────────────

/** Parent supplies all data. SpatialRenderer owns veneer + layer selection. */
export type SpatialRendererProps = Omit<
  SpatialMapProps,
  'veneer' | 'activeLayers' | 'width' | 'height' | 'onVeneerChange' | 'onLayerToggle'
> & {
  initialVeneer?: VeneerId;
  initialLayers?: LayerId[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SpatialRenderer({
  initialVeneer = 'flat_plan',
  initialLayers = ['devices'],
  ...passthrough
}: SpatialRendererProps) {
  const [veneer, setVeneer]           = useState<VeneerId>(initialVeneer);
  const [activeLayers, setActiveLayers] = useState<LayerId[]>(initialLayers);
  const [dims, setDims]               = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ width, height });
  }, []);

  const toggleLayer = useCallback((layerId: LayerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId],
    );
  }, []);

  const supportedLayers = VENEER_LAYER_SUPPORT[veneer];
  const ALL_VENEERS: VeneerId[] = ['flat_plan', 'isometric', 'watercolour', 'ar'];

  const veneerProps: SpatialMapProps = {
    ...passthrough,
    veneer,
    activeLayers,
    width: dims.width,
    height: dims.height,
    onVeneerChange: setVeneer,
    onLayerToggle:  toggleLayer,
  };

  const renderVeneer = () => {
    if (dims.width === 0) return null;
    switch (veneer) {
      case 'flat_plan': return <FlatPlanVeneer {...veneerProps} />;
      case 'isometric': return <IsometricVeneer {...veneerProps} />;
      default: return <StubVeneer veneer={veneer} width={dims.width} height={dims.height} />;
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>

      {/* ── Active veneer ─────────────────────────────────────────────── */}
      {renderVeneer()}

      {/* ── Layer toggle bar — top overlay ────────────────────────────── */}
      <View style={styles.layerBar} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.layerBarContent}
        >
          {supportedLayers.map(layerId => {
            const active = activeLayers.includes(layerId);
            return (
              <TouchableOpacity
                key={layerId}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => toggleLayer(layerId)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${LAYER_LABELS[layerId]} layer`}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {LAYER_LABELS[layerId]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Veneer switcher — bottom overlay ──────────────────────────── */}
      <View style={styles.veneerBar}>
        {ALL_VENEERS.map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.veneerTab, v === veneer && styles.veneerTabActive]}
            onPress={() => setVeneer(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: v === veneer }}
            accessibilityLabel={`${VENEER_LABELS[v]} view`}
          >
            <Text style={[styles.veneerText, v === veneer && styles.veneerTextActive]}>
              {VENEER_LABELS[v]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg:            '#1a1208',
  pillIdle:      'rgba(255, 255, 255, 0.10)',
  pillActive:    'rgba(255, 180, 80, 0.88)',
  pillTextIdle:  'rgba(255, 255, 255, 0.70)',
  pillTextOn:    '#1a1208',
  veneerBg:      'rgba(20, 16, 10, 0.88)',
  veneerActive:  '#FFA940',
  veneerTextOff: 'rgba(255, 255, 255, 0.50)',
  veneerTextOn:  '#1a1208',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Stub
  stub: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  stubTitle: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 20,
    fontWeight: '600',
  },
  stubSub: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 13,
    marginTop: 6,
  },

  // Layer bar
  layerBar: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  layerBarContent: {
    paddingHorizontal: 14,
    flexDirection: 'row',
  },
  pill: {
    backgroundColor: C.pillIdle,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: C.pillActive,
  },
  pillText: {
    color: C.pillTextIdle,
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: C.pillTextOn,
    fontWeight: '700',
  },

  // Veneer switcher
  veneerBar: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: C.veneerBg,
    borderRadius: 22,
    padding: 4,
    zIndex: 10,
  },
  veneerTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 18,
  },
  veneerTabActive: {
    backgroundColor: C.veneerActive,
  },
  veneerText: {
    color: C.veneerTextOff,
    fontSize: 11,
    fontWeight: '500',
  },
  veneerTextActive: {
    color: C.veneerTextOn,
    fontWeight: '700',
  },
});
