/**
 * FlatPlanVeneer — First veneer renderer for PULSE spatial map.
 *
 * Renders the 1988 floor plan (IMG_9254) as a background image with
 * react-native-svg zone polygon overlays, device pins, and infrastructure nodes.
 *
 * Visual language:
 *   - Zone polygons: warm white fill at low opacity (ambient presence)
 *   - Current zone:  amber warm fill (where signal is strongest)
 *   - Tapped zone:   brightened highlight
 *   - Aligned device pin: solid green circle (Metatron-aligned)
 *   - Unaligned device pin: dashed orange circle (needs attention)
 *   - Electrical node: yellow dot with label
 *   - Plumbing node:   blue dot with label
 *   - Pin radius: scaled by RSSI confidence (0.0–1.0)
 */

import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import type { SpatialMapProps } from '../SpatialTypes';
import { ZONE_POLYGONS } from '../ZoneGeometry';

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLOURS = {
  zoneFill:       'rgba(255, 255, 255, 0.10)',
  zoneFillActive: 'rgba(255, 180, 80, 0.35)',
  zoneFillTapped: 'rgba(255, 255, 255, 0.20)',
  zoneStroke:     'rgba(255, 255, 255, 0.25)',
  zoneStrokeActive: 'rgba(255, 180, 80, 0.8)',

  pinAligned:   '#4CAF50',        // green — Metatron aligned
  pinUnaligned: '#FF9800',        // amber — needs alignment
  pinUnknown:   'rgba(255,255,255,0.4)',
  pinLabel:     'rgba(255,255,255,0.8)',

  electricalNode:  '#FFD700',     // gold — electrical infrastructure
  plumbingNode:    '#4FC3F7',     // sky blue — water/gas/drainage
  nodeLabel:       'rgba(255,255,255,0.85)',
};

// ─── Min pin radius to stay tappable ─────────────────────────────────────────
const MIN_PIN_RADIUS = 6;
const MAX_PIN_RADIUS = 16;
const NODE_RADIUS    = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export function FlatPlanVeneer({
  zones,
  devicePins,
  currentZoneId,
  electricalNodes,
  plumbingNodes,
  activeLayers,
  onZoneTap,
  onDeviceTap,
  width,
  height,
}: SpatialMapProps) {

  const [tappedZone, setTappedZone] = useState<string | null>(null);
  const [imgFailed, setImgFailed]   = useState(false);

  const handleZoneTap = useCallback((zoneId: string) => {
    setTappedZone(zoneId);
    onZoneTap?.(zoneId as any);
  }, [onZoneTap]);

  // Convert normalised coords to pixel coords
  const px = (nx: number) => nx * width;
  const py = (ny: number) => ny * height;
  const toSvgPoints = (polygon: { x: number; y: number }[]) =>
    polygon.map(p => `${px(p.x)},${py(p.y)}`).join(' ');

  // Pin radius from RSSI confidence
  const pinRadius = (confidence: number) =>
    MIN_PIN_RADIUS + (MAX_PIN_RADIUS - MIN_PIN_RADIUS) * Math.max(0, Math.min(1, confidence));

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Base floor plan image — resizeMethod="resize" avoids Android bitmap OOM on large files.
          transform rotate: EXIF orientation is lower-right (180°) — correct here so zones align. */}
      {!imgFailed && (
        <Image
          source={require('../../../assets/floorplans/IMG_9254.jpeg')}
          style={[styles.floorPlan, { width, height, transform: [{ rotate: '180deg' }] }]}
          resizeMode="stretch"
          resizeMethod="resize"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* SVG overlay */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
      >
        {/* Zone polygons */}
        {ZONE_POLYGONS.map(zone => {
          const isActive = zone.zoneId === currentZoneId;
          const isTapped = zone.zoneId === tappedZone;
          const fill = isActive
            ? COLOURS.zoneFillActive
            : isTapped
              ? COLOURS.zoneFillTapped
              : COLOURS.zoneFill;
          const stroke = isActive
            ? COLOURS.zoneStrokeActive
            : COLOURS.zoneStroke;

          return (
            <Polygon
              key={zone.zoneId}
              points={toSvgPoints(zone.polygon)}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 1.5 : 0.8}
              onPress={() => handleZoneTap(zone.zoneId)}
            />
          );
        })}

        {/* Electrical nodes — shown when 'electrical' layer active */}
        {activeLayers.includes('electrical') && (electricalNodes ?? []).map(node => {
          const cx = px(node.position.x);
          const cy = py(node.position.y);
          return (
            <React.Fragment key={node.id}>
              <Circle
                cx={cx} cy={cy} r={NODE_RADIUS}
                fill={COLOURS.electricalNode}
                fillOpacity={0.9}
                stroke={COLOURS.electricalNode}
                strokeWidth={1}
              />
              <SvgText
                x={cx} y={cy + NODE_RADIUS + 8}
                fontSize={7} fill={COLOURS.nodeLabel} textAnchor="middle"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Plumbing nodes — shown when 'plumbing' layer active */}
        {activeLayers.includes('plumbing') && (plumbingNodes ?? []).map(node => {
          const cx = px(node.position.x);
          const cy = py(node.position.y);
          return (
            <React.Fragment key={node.id}>
              <Circle
                cx={cx} cy={cy} r={NODE_RADIUS}
                fill={COLOURS.plumbingNode}
                fillOpacity={0.9}
                stroke={COLOURS.plumbingNode}
                strokeWidth={1}
              />
              <SvgText
                x={cx} y={cy + NODE_RADIUS + 8}
                fontSize={7} fill={COLOURS.nodeLabel} textAnchor="middle"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Device pins */}
        {(devicePins ?? []).map(pin => {
          const cx = px(pin.position.x);
          const cy = py(pin.position.y);
          const r = pinRadius(pin.rssiAvg != null ? Math.min(1, Math.abs(pin.rssiAvg) / 100) : 0.4);
          const colour = pin.aligned ? COLOURS.pinAligned : COLOURS.pinUnaligned;

          return (
            <React.Fragment key={pin.deviceId}>
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                fill={colour}
                fillOpacity={0.85}
                stroke={colour}
                strokeWidth={1}
                onPress={() => onDeviceTap?.(pin.deviceId)}
              />
              {/* Label — only when radius large enough */}
              {r > 10 && (
                <SvgText
                  x={cx}
                  y={cy + r + 9}
                  fontSize={8}
                  fill={COLOURS.pinLabel}
                  textAnchor="middle"
                >
                  {pin.deviceId.slice(-4)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#0a0a0a',
  },
  floorPlan: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.6,   // floor plan image under SVG — dimmed to let zone colours read clearly
  },
});
