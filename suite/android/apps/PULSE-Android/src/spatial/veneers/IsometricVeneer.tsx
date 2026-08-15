/**
 * IsometricVeneer — Dollhouse cutaway view of the Mount Eliza estate.
 *
 * Renders stacked floor layers (-1, 0, 1) using isometric projection.
 *
 * Projection Logic:
 *   - Uses normalized (x,y) from ZoneGeometry.
 *   - levelOffset separates the floors vertically.
 *   - void aesthetic: dark surfaces, glowing neon borders.
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import Svg, { G, Polygon, Circle, Text as SvgText, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import type { SpatialMapProps, Point, ZoneGeometry } from '../SpatialTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const ISO_ANGLE = Math.PI / 6; // 30 degrees
const LEVEL_HEIGHT = 120;      // Vertical separation between floors
const BASE_SCALE = 0.8;        // Default zoom

const THEME = {
  bg: '#050505',
  floorFill: 'rgba(20, 22, 28, 0.9)',
  floorStroke: '#4af',
  floorStrokeActive: '#fb3',
  floorOpacityDim: 0.15,
  pinGlow: '#4af',
  pinAligned: '#2d2',
  pinUnaligned: '#f62',
};

// ─── Projection Helper ────────────────────────────────────────────────────────

interface ProjectionParams {
  nx: number;      // normalized x [0,1]
  ny: number;      // normalized y [0,1]
  level: number;
  width: number;
  height: number;
  scale: number;
  offsetY: number;
  focusLevel: number | null;
}

function project(p: Point, level: number, width: number, height: number, scale: number, offsetY: number) {
  // Center coordinates around (0.5, 0.5)
  const dx = (p.x - 0.5) * width * scale;
  const dy = (p.y - 0.5) * height * scale;

  const x = (dx - dy) * Math.cos(ISO_ANGLE);
  const y = (dx + dy) * Math.sin(ISO_ANGLE) - (level * LEVEL_HEIGHT);

  return {
    x: width / 2 + x,
    y: height / 2 + y + offsetY,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IsometricVeneer({
  zones,
  devicePins,
  currentZoneId,
  activeLayers,
  onZoneTap,
  onDeviceTap,
  width,
  height,
}: SpatialMapProps) {
  const [focusLevel, setFocusLevel] = useState<number | null>(null);
  const [focusedZone, setFocusedZone] = useState<string | null>(null);

  // Dynamic parameters based on focus
  const scale = focusedZone ? BASE_SCALE * 1.8 : BASE_SCALE;
  const offsetY = focusedZone ? height * 0.1 : 0;

  const projectedZones = useMemo(() => {
    return zones.map(z => ({
      ...z,
      projectedPolygon: z.polygon.map(p => project(p, z.level, width, height, scale, offsetY)),
      projectedCentroid: project(z.centroid, z.level, width, height, scale, offsetY),
    }));
  }, [zones, width, height, scale, offsetY]);

  const handleZonePress = (zone: ZoneGeometry) => {
    if (focusedZone === zone.zoneId) {
      setFocusedZone(null);
      setFocusLevel(null);
    } else {
      setFocusedZone(zone.zoneId);
      setFocusLevel(zone.level);
    }
    onZoneTap?.(zone.zoneId);
  };

  const handleLevelTab = (level: number) => {
    setFocusLevel(focusLevel === level ? null : level);
    setFocusedZone(null);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Filter id="glow">
            <FeGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <FeMerge>
              <FeMergeNode in="coloredBlur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs>

        {/* Render levels from bottom to top for correct painter's algorithm depth */}
        {[-1, 0, 1].map(lvl => {
          const isLevelDimmed = focusLevel !== null && focusLevel !== lvl;
          const levelOpacity = isLevelDimmed ? THEME.floorOpacityDim : 1;

          return (
            <G key={`level-${lvl}`} opacity={levelOpacity}>
              {projectedZones
                .filter(z => z.level === lvl)
                .map(z => {
                  const isFocused = focusedZone === z.zoneId;
                  const isCurrent = currentZoneId === z.zoneId;

                  return (
                    <G key={z.zoneId}>
                      <Polygon
                        points={z.projectedPolygon.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={THEME.floorFill}
                        stroke={isFocused || isCurrent ? THEME.floorStrokeActive : THEME.floorStroke}
                        strokeWidth={isFocused ? 2 : 1}
                        filter={isFocused || isCurrent ? "url(#glow)" : undefined}
                        onPress={() => handleZonePress(z)}
                      />
                      {isFocused && (
                        <SvgText
                          x={z.projectedCentroid.x}
                          y={z.projectedCentroid.y - 10}
                          fill="#fff"
                          fontSize="10"
                          textAnchor="middle"
                          fontWeight="bold"
                          pointerEvents="none"
                        >
                          {z.label?.toUpperCase()}
                        </SvgText>
                      )}
                    </G>
                  );
                })}

              {/* Pins on this level */}
              {activeLayers.includes('devices') && devicePins
                .filter(p => {
                    const zone = zones.find(z => z.zoneId === p.zoneId);
                    return zone?.level === lvl;
                })
                .map(pin => {
                  const zone = zones.find(z => z.zoneId === pin.zoneId)!;
                  const pos = project(pin.position, zone.level, width, height, scale, offsetY);
                  const color = pin.aligned ? THEME.pinAligned : THEME.pinUnaligned;

                  return (
                    <G key={pin.deviceId}>
                      <Circle
                        cx={pos.x}
                        cy={pos.y}
                        r={4}
                        fill={color}
                        filter="url(#glow)"
                        onPress={() => onDeviceTap(pin.deviceId)}
                      />
                    </G>
                  );
                })}
            </G>
          );
        })}
      </Svg>

      {/* Level Selector overlay */}
      <View style={styles.levelSelector}>
        {[1, 0, -1].map(lvl => (
          <TouchableOpacity
            key={lvl}
            style={[styles.levelBtn, focusLevel === lvl && styles.levelBtnActive]}
            onPress={() => handleLevelTab(lvl)}
          >
            <Text style={[styles.levelBtnText, focusLevel === lvl && styles.levelBtnTextActive]}>
              {lvl === 1 ? 'UPPER' : lvl === 0 ? 'MAIN' : 'CELLAR'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bg,
  },
  levelSelector: {
    position: 'absolute',
    right: 16,
    top: '30%',
    gap: 12,
  },
  levelBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: 'rgba(74, 175, 255, 0.2)',
    borderColor: '#4af',
  },
  levelBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelBtnTextActive: {
    color: '#4af',
  },
});
