import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  LogBox,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BleManager, Device } from 'react-native-ble-plx';
import Zeroconf from 'react-native-zeroconf';
import Geolocation from 'react-native-geolocation-service';
import { SENSOR_THEME, SURFACE } from './src/theme';
import { metatronTranslate, rssiToDistance } from './src/bleIdentifier';
import { initRegistry, observe } from './src/deviceRegistry';
import { executeAction } from './src/executeAction';
import { ZONE_POLYGONS } from './src/spatial/ZoneGeometry';
import { SpatialRenderer } from './src/spatial/SpatialRenderer';
import { ELECTRICAL_NODES } from './src/spatial/layers/ElectricalLayerData';
import { PLUMBING_NODES } from './src/spatial/layers/PlumbingLayerData';

LogBox.ignoreAllLogs();

const PULSE_VERSION = '0.2.1-dev';
const PULSE_SERVICE_TYPE = '_pulse._tcp.';
const PULSE_FALLBACK_URL = 'http://192.168.86.39:9000';
const bleManager = new BleManager();

// Scout identity — stable per install (resets on app reinstall)
const SCOUT_ID = `scout-${Math.random().toString(36).slice(2, 10)}-${Platform.OS}`;

// Bonjour discovery — finds _pulse._tcp. on the LAN, no hardcoded IP needed
let _discoveredServerUrl: string | null = null;
let _zeroconf: Zeroconf | null = null;

function startBonjourDiscovery(onFound: (url: string) => void): void {
  if (_zeroconf) return;
  _zeroconf = new Zeroconf();
  _zeroconf.on('resolved', (service: any) => {
    const host = service.host || service.addresses?.[0];
    const port = service.port || 9000;
    if (host) {
      const url = `http://${host}:${port}`;
      _discoveredServerUrl = url;
      onFound(url);
    }
  });
  _zeroconf.scan(PULSE_SERVICE_TYPE, 'tcp', 'local.');
}

function getServerUrl(): string {
  return _discoveredServerUrl ?? PULSE_FALLBACK_URL;
}

/**
 * Polyfill for AbortSignal.timeout which is missing in many RN environments
 */
function getTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

type TabId = 'scan' | 'map';
type ScanStatus = 'idle' | 'scanning' | 'done' | 'unavailable';
type GpsStatus = 'idle' | 'active' | 'unavailable';

type GpsPosition = {
  lat: number;
  lon: number;
  accuracy: number;
};

async function requestPermissions(): Promise<'granted' | 'denied' | 'blocked'> {
  if (Platform.OS !== 'android') return 'granted';
  const grants = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
  const values = Object.values(grants);
  if (values.every(v => v === PermissionsAndroid.RESULTS.GRANTED)) return 'granted';
  if (values.some(v => v === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) return 'blocked';
  return 'denied';
}

type TranslatedDevice = { device: Device; profile: ReturnType<typeof metatronTranslate> | null };

function PulseHomeScreen() {
  const [tab, setTab]         = useState<TabId>('scan');
  const [bleStatus, setBleStatus] = useState<ScanStatus>('idle');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [metroLive] = useState(true);
  const [tick, setTick] = useState(0);
  const [devices, setDevices] = useState<TranslatedDevice[]>([]);
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  const [scanStartMs, setScanStartMs] = useState<number | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gpsWatchId = useRef<number | null>(null);
  const [serverUrl, setServerUrl] = useState(PULSE_FALLBACK_URL);
  const [serverOnline, setServerOnline] = useState(false);
  const [showFidelity, setShowFidelity] = useState(false);

  useEffect(() => {
    initRegistry().catch(e => console.warn('initRegistry failed:', e));
  }, []);

  // Bonjour discovery + server keepalive ping
  useEffect(() => {
    startBonjourDiscovery(url => {
      setServerUrl(url);
      setServerOnline(true);
    });
    const ping = async () => {
      try {
        const r = await fetch(`${getServerUrl()}/status`, {
          signal: getTimeoutSignal(2000)
        });
        setServerOnline(r.ok);
      } catch { setServerOnline(false); }
    };
    ping();
    const id = setInterval(ping, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      // bleManager lives at module scope (BLE radio lifecycle ≠ component lifecycle)
      // Only stop any in-progress scan — never destroy the manager here
      try { bleManager.stopDeviceScan(); } catch {}
      if (gpsWatchId.current !== null) Geolocation.clearWatch(gpsWatchId.current);
    };
  }, []);

  const handleScan = useCallback(async () => {
    const result = await requestPermissions();
    if (result === 'blocked') {
      setBleStatus('unavailable');
      setBleError('Permissions blocked — tap to open Settings');
      setGpsStatus('unavailable');
      Linking.openSettings();
      return;
    }
    if (result === 'denied') {
      setBleStatus('unavailable');
      setBleError('Permissions denied — tap Scan to try again');
      setGpsStatus('unavailable');
      return;
    }

    // GPS — watch position, refines continuously as satellites lock
    if (gpsWatchId.current !== null) Geolocation.clearWatch(gpsWatchId.current);
    setGpsStatus('active');
    gpsWatchId.current = Geolocation.watchPosition(
      pos => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsStatus('active');
      },
      err => {
        console.warn('GPS error:', err.message);
        setGpsStatus('unavailable');
      },
      { enableHighAccuracy: true, interval: 3000, fastestInterval: 1000, forceRequestLocation: true },
    );

    // BLE — wait for POWERED_ON before scanning
    setBleError(null);
    setDevices([]);
    setBleStatus('scanning');
    setScanStartMs(Date.now());
    const seen = new Set<string>();

    try {
      const bleState = await bleManager.state();
      if (bleState !== 'PoweredOn') {
        setBleStatus('unavailable');
        setBleError(`BLE state: ${bleState}`);
        setScanStartMs(null);
        return;
      }

      if (scanTimer.current) clearTimeout(scanTimer.current);

      bleManager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
        if (err) {
          // Android signals scan complete or BLE error via callback
          if (scanTimer.current) clearTimeout(scanTimer.current);
          setBleStatus('done');
          setScanStartMs(null);
          if (err.errorCode !== 201) setBleError(err.message); // 201 = stopped normally
          return;
        }
        if (device && !seen.has(device.id)) {
          seen.add(device.id);
          
          // 1. Instantly parse and map to action
          let profile: ReturnType<typeof metatronTranslate> | null = null;
          try { profile = metatronTranslate(device); } catch {}

          // 2. ENFORCE INVARIANT: Execute the action directly (no UI reliance)
          const action = profile?.action ?? 'log';
          executeAction(action, device, bleManager).catch(() => {});

          // 3. Update display state after physical execution is enacted
          setDevices(prev => [...prev, { device, profile }].slice(0, 20));
        }
      });

      scanTimer.current = setTimeout(() => {
        bleManager.stopDeviceScan();
        setBleStatus('done');
        setScanStartMs(null);
      }, 8000);
    } catch (e: any) {
      setBleStatus('unavailable');
      setBleError(e?.message ?? 'BLE scan error');
      setScanStartMs(null);
    }
  }, []);

  const wifiState = 'connected';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>◉ PULSE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.dot, serverOnline && styles.dotActive, { width: 6, height: 6 }]} />
          <Text style={styles.version}>{PULSE_VERSION}</Text>
        </View>
      </View>

      {/* ── SCAN TAB ──────────────────────────────────────────────────────── */}
      {tab === 'scan' && (
        <>
          {/* Heartbeat */}
          <View style={styles.heartbeatRow}>
            <View style={[styles.dot, tick % 2 === 0 && styles.dotActive]} />
            <Text style={styles.heartbeatText}>Metro live · {tick}s</Text>
          </View>

          {/* Status grid */}
          <View style={styles.grid}>
            <StatusCard label="BLE"   state={bleStatus} />
            <StatusCard label="WiFi"  state={wifiState} />
            <StatusCard label="GPS"   state={gpsStatus} />
            <StatusCard label="Metro" state={metroLive ? 'live' : 'disconnected'} />
          </View>

          {/* GPS result */}
          {position && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>POSITION</Text>
              <Text style={styles.infoValue}>
                {position.lat.toFixed(5)}, {position.lon.toFixed(5)}
              </Text>
              <View style={styles.accuracyRow}>
                <Text style={[styles.accuracyBadge,
                  position.accuracy <= 10 ? styles.accuracyGood :
                  position.accuracy <= 30 ? styles.accuracyOk :
                  styles.accuracyPoor]}>
                  ±{position.accuracy}m
                </Text>
                <Text style={styles.infoSub}>Android API {Platform.Version}</Text>
              </View>
            </View>
          )}

          {/* BLE error diagnostic */}
          {bleError && (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>⚠ {bleError}</Text>
            </View>
          )}

          {/* Scan button */}
          <TouchableOpacity
            style={[styles.scanButton, bleStatus === 'scanning' && styles.scanButtonActive]}
            onPress={bleStatus === 'scanning'
              ? () => { bleManager.stopDeviceScan(); setBleStatus('done'); setScanStartMs(null); }
              : handleScan}
            activeOpacity={0.75}>
            <Text style={styles.scanButtonText}>
              {bleStatus === 'scanning'
                ? `⟳  Scanning… ${Math.max(0, 8 - Math.floor((Date.now() - (scanStartMs ?? Date.now())) / 1000))}s  · tap to stop`
                : '⊕  Scan Environment'}
            </Text>
          </TouchableOpacity>

          {/* Fidelity Check — fires calibration sweep across all seated speakers */}
          <TouchableOpacity
            style={[styles.scanButton, { borderColor: serverOnline ? 'rgba(245,158,11,0.45)' : '#1a1a2e', marginBottom: 16 }]}
            onPress={() => setShowFidelity(true)}
            activeOpacity={0.75}>
            <Text style={[styles.scanButtonText, { color: serverOnline ? 'rgba(245,158,11,0.9)' : '#446' }]}>
              ∿  Fidelity Check
            </Text>
          </TouchableOpacity>

          {/* BLE device list */}
          {devices.length > 0 && (
            <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
              {(() => {
                  const rows = devices.map(({ device: d, profile }) => {
                  const tier = profile?.alignment ?? 'unaligned';
                  const color = profile?.color;
                  return { d, profile, tier, color };
                });
                const unaligned = rows.filter(r => r.tier === 'unaligned').length;
                return (
                  <>
                    <View style={styles.deviceListHeaderRow}>
                      <Text style={styles.deviceListHeader}>BLE DEVICES NEARBY · {devices.length}</Text>
                      {unaligned > 0 && (
                        <Text style={styles.anomalyBadge}>⬡ {unaligned} UNALIGNED</Text>
                      )}
                    </View>
                    {rows.map(({ d, profile, tier, color }) => (
                      <View
                        key={d.id}
                        style={[
                          styles.deviceRow,
                          tier === 'unaligned' && styles.deviceRowAnomaly,
                          tier === 'partial'   && styles.deviceRowPartial,
                          color && { borderLeftColor: color.primary, borderLeftWidth: 2 },
                        ]}
                      >
                        <View style={styles.deviceInfo}>
                          <Text style={[
                            styles.deviceName,
                            tier === 'unaligned' && styles.deviceNameAnomaly,
                            tier === 'partial'   && styles.deviceNamePartial,
                            color && { color: color.primary },
                          ]}>
                            {profile?.label ?? (d.name ?? '⬡ unaligned device')}
                          </Text>
                          {profile?.sublabel ? (
                            <Text style={[styles.deviceRole, color && { color: color.primary + '99' }]}>
                              {profile.sublabel}
                            </Text>
                          ) : tier === 'unaligned' && (
                            <Text style={styles.deviceRoleAnomaly}>◎ unaligned · seeking identity</Text>
                          )}
                        </View>
                        <View style={styles.deviceSignal}>
                          <Text style={styles.deviceRssi}>{d.rssi} dBm</Text>
                          <Text style={styles.deviceDist}>{rssiToDistance(d.rssi ?? -100)}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          )}

          <Text style={styles.tagline}>
            <Text style={styles.taglineSymbol}>⬡</Text>
            {'  SOVEREIGN HOME OPERATING SYSTEM  '}
            <Text style={styles.taglineSymbol}>⬡</Text>
          </Text>
        </>
      )}

      {/* ── MAP TAB ───────────────────────────────────────────────────────── */}
      {tab === 'map' && (
        <View style={styles.mapContainer}>
          <SpatialRenderer
            zones={ZONE_POLYGONS}
            devicePins={[]}
            currentZoneId={null}
            electricalNodes={ELECTRICAL_NODES}
            plumbingNodes={PLUMBING_NODES}
            hvacNodes={null}
            irrigationNodes={null}
            undergroundNodes={null}
            onZoneTap={id => console.log('[PULSE] zone tap:', id)}
            onDeviceTap={id => console.log('[PULSE] device tap:', id)}
            initialVeneer="flat_plan"
            initialLayers={['electrical']}
          />
        </View>
      )}

      {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
      {/* Fidelity Ceremony — full-screen modal, rendered outside tab logic so it doesn't unmount mid-sweep */}
      <Modal visible={showFidelity} animationType="fade" onRequestClose={() => setShowFidelity(false)}>
        <FidelityCeremony baseUrl={serverUrl} onClose={() => setShowFidelity(false)} />
      </Modal>

      {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'scan' && styles.tabItemActive]}
          onPress={() => setTab('scan')}
          activeOpacity={0.7}>
          <Text style={[styles.tabIcon, tab === 'scan' && styles.tabIconActive]}>⊕</Text>
          <Text style={[styles.tabLabel, tab === 'scan' && styles.tabLabelActive]}>SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'map' && styles.tabItemActive]}
          onPress={() => setTab('map')}
          activeOpacity={0.7}>
          <Text style={[styles.tabIcon, tab === 'map' && styles.tabIconActive]}>⬡</Text>
          <Text style={[styles.tabLabel, tab === 'map' && styles.tabLabelActive]}>MAP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type SensorKey = keyof typeof SENSOR_THEME;

function StatusCard({ label, state }: { label: SensorKey; state: string }) {
  const freq = SENSOR_THEME[label];
  const hot   = state !== 'idle' && state !== 'unavailable';
  const dead  = state === 'unavailable';
  return (
    <View style={[
      styles.card,
      { borderColor: hot ? freq.border : dead ? '#2a1a1a' : '#1a2a1a' },
      { backgroundColor: hot ? freq.dim : dead ? '#0d0d0d' : '#0d120d' },
    ]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardState, { color: hot ? freq.primary : dead ? '#444' : '#3a5a3a' }]}>
        {state}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ∿  FIDELITY CEREMONY
// Aesthetic: stone that glows · worn leather · cognitive minimalism
//            geometric sigils drifting like Dr Strange mandalas
// ═══════════════════════════════════════════════════════════════════════════════

const CAL = {
  bg:        '#120E09',
  glow:      '#F59E0B',
  glowDim:   '#92400E',
  parchment: '#D4C4A0',
  stone:     '#2C2018',
  sigil:     'rgba(212,196,160,0.14)',
  obiwan:    '#CBD5E1',
  polk:      '#6EE7B7',
};

const SIGIL_POSITIONS: Array<{s: string; x: number; y: number; delay: number; size: number}> = [
  { s: '◉', x: 8,  y: 12, delay: 0,    size: 28 },
  { s: '▲', x: 78, y: 8,  delay: 400,  size: 22 },
  { s: '∿', x: 85, y: 55, delay: 900,  size: 26 },
  { s: '▼', x: 6,  y: 62, delay: 200,  size: 22 },
  { s: '●', x: 70, y: 82, delay: 700,  size: 20 },
  { s: '◻', x: 18, y: 78, delay: 1100, size: 18 },
  { s: '⬡', x: 88, y: 30, delay: 300,  size: 16 },
  { s: '◼', x: 40, y: 88, delay: 600,  size: 15 },
];

const FloatingSigil: React.FC<{s: string; x: number; y: number; delay: number; size: number}> = ({s, x, y, delay, size}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -13, duration: 2600 + delay * 0.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0,   duration: 2600 + delay * 0.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: size, color: CAL.sigil, opacity, transform: [{ translateY }] }}>
      {s}
    </Animated.Text>
  );
};

const ExpandingRing: React.FC<{color: string; delay: number; active: boolean}> = ({color, delay, active}) => {
  const scale   = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const loop    = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (active) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 2.8, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.55, duration: 300,  useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0,    duration: 1600, useNativeDriver: true }),
            ]),
          ]),
        ])
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => scale.setValue(0.3));
    }
    return () => loop.current?.stop();
  }, [active]);
  return (
    <Animated.View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, borderColor: color, opacity, transform: [{ scale }] }} />
  );
};

const BackgroundMandala: React.FC = () => {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 40000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.Text style={{ position: 'absolute', fontSize: 320, color: 'rgba(245,158,11,0.04)', transform: [{ rotate: spin }] }}>◉</Animated.Text>
  );
};

interface CalStatus {
  active:    boolean;
  speaker?:  string;
  label?:    string;
  color?:    string;
  progress?: number;
  freq_hz?:  number;
  phase?:    string;
  results?:  Record<string, {latency_ms?: number; freq_range?: string; harmonic_verdict?: string}>;
}

const NEEDLE_H = 180;

const FidelityCeremony: React.FC<{baseUrl: string; onClose: () => void}> = ({baseUrl, onClose}) => {
  const [calStatus, setCalStatus] = useState<CalStatus>({ active: false });
  const [started,   setStarted]   = useState(false);
  const needleAnim = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = async () => {
      try {
        await fetch(`${baseUrl}/calibration/start?speaker=all`);
        setStarted(true);
      } catch (e) { console.warn('[cal] start failed', e); }
    };
    start();
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${baseUrl}/calibration/status`);
        const s: CalStatus = await r.json();
        setCalStatus(s);
        if (s.freq_hz && s.active) {
          const pct = Math.min(1, Math.max(0, (s.freq_hz - 80) / (6000 - 80)));
          Animated.timing(needleAnim, { toValue: pct * NEEDLE_H, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
        }
        if (!s.active && s.phase === 'complete' && s.results) {
          clearInterval(pollRef.current!);
          Animated.timing(resultFade, { toValue: 1, duration: 900, useNativeDriver: true }).start();
        }
      } catch {}
    }, 200);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [baseUrl]);

  const speakerColor = calStatus.color ?? CAL.glow;
  const isActive     = calStatus.active === true;
  const isComplete   = calStatus.phase === 'complete';
  const freqLabel    = calStatus.freq_hz ? `${Math.round(calStatus.freq_hz)} Hz` : '— Hz';

  return (
    <View style={cal.root}>
      <StatusBar hidden />
      <BackgroundMandala />
      {SIGIL_POSITIONS.map(p => <FloatingSigil key={p.s} {...p} />)}
      <View style={cal.ringStage}>
        <ExpandingRing color={speakerColor} delay={0}    active={isActive} />
        <ExpandingRing color={speakerColor} delay={600}  active={isActive} />
        <ExpandingRing color={speakerColor} delay={1200} active={isActive} />
        <Text style={[cal.centerGlyph, { color: speakerColor }]}>
          {calStatus.speaker === 'obiwan' ? '●' : calStatus.speaker === 'polk' ? '■' : '∿'}
        </Text>
      </View>
      <Text style={cal.speakerLabel}>
        {calStatus.label ?? (started ? 'initialising…' : 'connecting…')}
      </Text>
      {isActive && (
        <View style={cal.needleTrack}>
          <View style={cal.needleRail} />
          <Animated.View style={[cal.needleDot, { bottom: needleAnim }]} />
          <Text style={cal.needleTopLabel}>6k</Text>
          <Text style={cal.needleBottomLabel}>80</Text>
        </View>
      )}
      {isActive && <Text style={cal.freqReadout}>∿  {freqLabel}</Text>}
      {isComplete && calStatus.results && (
        <Animated.View style={[cal.results, { opacity: resultFade }]}>
          {Object.entries(calStatus.results).map(([spk, r]) => {
            const domainColor = spk === 'obiwan' ? CAL.obiwan : CAL.polk;
            const latency = r.latency_ms != null ? `${r.latency_ms} ms` : '—';
            return (
              <View key={spk} style={cal.resultRow}>
                <Text style={[cal.resultGlyph, { color: domainColor }]}>
                  {spk === 'obiwan' ? '●' : '■'}
                </Text>
                <View>
                  <Text style={[cal.resultName, { color: domainColor }]}>{spk === 'obiwan' ? 'OBI-WAN' : 'POLK'}</Text>
                  <Text style={cal.resultFidelity}>∿  faithful</Text>
                  <Text style={cal.resultLatency}>{latency} latency</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      )}
      <TouchableOpacity style={cal.dismiss} onPress={onClose} activeOpacity={0.6}>
        <Text style={cal.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const cal = StyleSheet.create({
  root: { flex: 1, backgroundColor: CAL.bg, alignItems: 'center', justifyContent: 'center' },
  ringStage: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  centerGlyph: { fontSize: 54, position: 'absolute' },
  speakerLabel: { marginTop: 32, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: CAL.parchment, opacity: 0.7 },
  freqReadout: { marginTop: 16, fontSize: 22, letterSpacing: 2, color: CAL.glow, fontVariant: ['tabular-nums'] },
  needleTrack: { position: 'absolute', right: 28, bottom: 120, height: NEEDLE_H, width: 28, alignItems: 'center' },
  needleRail: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(245,158,11,0.18)' },
  needleDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: CAL.glow, shadowColor: CAL.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 6, left: 10 },
  needleTopLabel: { position: 'absolute', top: -14, fontSize: 9, color: CAL.parchment, opacity: 0.45, letterSpacing: 1 },
  needleBottomLabel: { position: 'absolute', bottom: -14, fontSize: 9, color: CAL.parchment, opacity: 0.45, letterSpacing: 1 },
  results: { marginTop: 40, gap: 20, alignItems: 'flex-start' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  resultGlyph: { fontSize: 32 },
  resultName: { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.9 },
  resultFidelity: { fontSize: 20, color: CAL.parchment, letterSpacing: 1, marginTop: 2 },
  resultLatency: { fontSize: 11, color: CAL.parchment, opacity: 0.45, letterSpacing: 2, marginTop: 3 },
  dismiss: { position: 'absolute', top: 52, right: 24, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(212,196,160,0.2)', alignItems: 'center', justifyContent: 'center' },
  dismissText: { color: CAL.parchment, opacity: 0.4, fontSize: 14 },
});

// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <PulseHomeScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  screen: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingBottom: 0 },

  // ── Map ─────────────────────────────────────────────────────────────────
  mapContainer: { flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 0 },

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 16, 10, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 180, 80, 0.20)',
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 180, 80, 0.12)',
  },
  tabIcon: { fontSize: 18, color: 'rgba(255,255,255,0.35)', marginBottom: 2 },
  tabIconActive: { color: '#FFA940' },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)' },
  tabLabelActive: { color: '#FFA940' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  logo: { fontSize: 32, fontWeight: '700', color: '#e0f0ff', letterSpacing: 4 },
  version: { fontSize: 11, color: '#446', marginBottom: 4 },

  heartbeatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#223', marginRight: 8 },
  dotActive: { backgroundColor: '#4af' },
  heartbeatText: { fontSize: 12, color: '#4af', fontFamily: 'monospace' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card: { flex: 1, minWidth: '40%', borderRadius: 12, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 11, color: SURFACE.textMuted, fontWeight: '600', marginBottom: 4, letterSpacing: 1 },
  cardState: { fontSize: 14, fontWeight: '500' },

  infoBlock: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a2e' },
  infoLabel: { fontSize: 10, color: '#4af', letterSpacing: 2, marginBottom: 4, fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#8cf', fontFamily: 'monospace', marginBottom: 6 },
  infoSub: { fontSize: 11, color: '#446', fontFamily: 'monospace' },
  accuracyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accuracyBadge: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  accuracyGood: { color: '#2d2', backgroundColor: '#0d1a0d' },   // ≤10m — tight fix
  accuracyOk:   { color: '#fa6', backgroundColor: '#1a1000' },   // ≤30m — usable
  accuracyPoor: { color: '#f44', backgroundColor: '#1a0a0a' },   // >30m  — weak

  scanButton: { backgroundColor: '#0d2a40', borderWidth: 1, borderColor: '#4af', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16 },
  scanButtonActive: { backgroundColor: '#0a1a28', borderColor: '#246' },
  scanButtonText: { color: '#4af', fontSize: 16, fontWeight: '600', letterSpacing: 1 },

  deviceList: { flex: 1, marginBottom: 12 },
  deviceListHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deviceListHeader: { fontSize: 10, color: '#4af', letterSpacing: 2, fontWeight: '600' },
  anomalyBadge: { fontSize: 10, color: '#fa6', letterSpacing: 1, fontWeight: '700' },
  deviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  deviceRowPartial: { borderBottomColor: '#2a2010' },
  deviceRowAnomaly: { borderBottomColor: '#3a1a00', backgroundColor: '#120800' },
  deviceInfo: { flex: 1, marginRight: 8 },
  deviceName: { fontSize: 13, color: '#8ab', fontFamily: 'monospace' },
  deviceNamePartial: { color: '#ca8' },   // amber — partial ID
  deviceNameAnomaly: { color: '#f84' },   // orange-red — no ID
  deviceRole: { fontSize: 11, color: '#446', fontFamily: 'monospace', marginTop: 2 },
  deviceRoleAnomaly: { fontSize: 10, color: '#642', fontFamily: 'monospace', marginTop: 2 },
  deviceSignal: { alignItems: 'flex-end' },
  deviceRssi: { fontSize: 12, color: '#446', fontFamily: 'monospace' },
  deviceDist: { fontSize: 11, color: '#334', fontFamily: 'monospace', marginTop: 2 },

  tagline: { textAlign: 'center', fontSize: 11, color: '#334', letterSpacing: 2, paddingVertical: 8 },
  taglineSymbol: { color: '#4af' },

  errorBlock: { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#f44', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#f88', fontSize: 12, fontFamily: 'monospace' },
});

export default App;
