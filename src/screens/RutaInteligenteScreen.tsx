import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CampusMap } from '../components/CampusMap';
import { destinations, getDestination } from '../data/destinations';
import { getCurrentUserLocation } from '../services/location';
import { recordRutaInteligenteUse } from '../services/incentives';
import { listObstacles, type Obstacle } from '../services/obstacles';
import {
  computeRouteOptionsFromGps,
  type RouteOption,
} from '../services/routing';
import {
  fetchCampusWeather,
  weatherAdvice,
  type WeatherSnapshot,
} from '../services/weather';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { formatMeters } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'RutaInteligente'>;

export function RutaInteligenteScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [toId, setToId] = useState('fiec');
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [locationNote, setLocationNote] = useState('Obteniendo GPS…');
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selected, setSelected] = useState<RouteOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = useCallback(async () => {
    const loc = await getCurrentUserLocation();
    setUser({ lat: loc.lat, lng: loc.lng });
    setLocationNote(
      loc.mocked
        ? 'GPS no disponible — usando centro del campus (demo)'
        : `Tu ubicación (±${Math.round(loc.accuracy ?? 0)} m)`
    );
    return loc;
  }, []);

  const computeFor = useCallback(
    async (countAsUse: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const [loc, w, obs] = await Promise.all([
          refreshLocation(),
          fetchCampusWeather(),
          listObstacles(),
        ]);
        setWeather(w);
        setObstacles(obs);
        const next = computeRouteOptionsFromGps(
          { lat: loc.lat, lng: loc.lng },
          toId,
          w,
          obs
        );
        setOptions(next);
        setSelected(next.find((o) => !o.blocked) ?? next[0] ?? null);
        if (countAsUse) {
          await recordRutaInteligenteUse();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo analizar la ruta');
      } finally {
        setLoading(false);
      }
    },
    [refreshLocation, toId]
  );

  useEffect(() => {
    computeFor(false);
  }, [computeFor]);

  useEffect(() => {
    // Entrar a Ruta Inteligente cuenta como uso del día (racha / misión explorador).
    recordRutaInteligenteUse();
  }, []);

  const analyze = () => computeFor(true);

  const dest = getDestination(toId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Ruta Inteligente</Text>
        <Pressable
          onPress={() => navigation.navigate('ReportObstacle')}
          style={styles.backBtn}
        >
          <Ionicons name="camera-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.mapBox}>
        <CampusMap
          user={user}
          destination={dest ? { lat: dest.lat, lng: dest.lng, name: dest.name } : null}
          route={selected?.coordinates ?? []}
          followUser={!selected}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} style={styles.sheet}>
        <Text style={styles.originLabel}>Punto de partida</Text>
        <Text style={styles.originValue}>Tu ubicación actual (GPS)</Text>
        <Text style={styles.meta}>{locationNote}</Text>

        <Text style={styles.section}>Destino (facultades / puntos ESPOL)</Text>
        <View style={styles.chips}>
          {destinations.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setToId(p.id)}
              style={[styles.chip, toId === p.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, toId === p.id && styles.chipTextOn]}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryBtn} onPress={analyze}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.primaryText}>Analizar desde mi ubicación</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {weather ? (
          <View style={styles.weatherCard}>
            <Text style={styles.weatherTitle}>Condiciones campus</Text>
            <Text style={styles.weatherLine}>
              {weather.temperatureC.toFixed(1)}°C · UV {weather.uvIndex.toFixed(0)} · Lluvia{' '}
              {weather.precipitationProbability}% · Viento {weather.windKmh.toFixed(0)} km/h
            </Text>
            <Text style={styles.weatherAdvice}>{weatherAdvice(weather)}</Text>
            <Text style={styles.meta}>
              Obstáculos activos: {obstacles.filter((o) => o.severity !== 'low').length}
            </Text>
          </View>
        ) : null}

        <Text style={styles.section}>Tipo de ruta</Text>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setSelected(opt)}
            style={[
              styles.routeCard,
              selected?.id === opt.id && styles.routeSelected,
              opt.blocked && styles.routeBlocked,
            ]}
          >
            <View style={styles.routeHeader}>
              <Text style={styles.routeLabel}>{opt.label}</Text>
              <Text style={styles.routeEta}>
                {formatMeters(opt.distanceM)} · {opt.etaMin} min
              </Text>
            </View>
            <Text style={styles.routeDesc}>{opt.description}</Text>
            {opt.warnings.map((w) => (
              <Text key={w} style={styles.warn}>
                ⚠ {w}
              </Text>
            ))}
            <Pressable
              disabled={opt.blocked || !opt.coordinates.length}
              style={[
                styles.secondaryBtn,
                (opt.blocked || !opt.coordinates.length) && styles.disabled,
              ]}
              onPress={() =>
                navigation.navigate('WalkNavigation', {
                  toId,
                  optionLabel: opt.label,
                  kind: opt.kind,
                  coordinates: opt.coordinates,
                  distanceM: opt.distanceM,
                })
              }
            >
              <Text style={styles.secondaryText}>
                {opt.blocked ? 'No disponible' : 'Iniciar navegación'}
              </Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  mapBox: { height: 240, marginHorizontal: 12, borderRadius: 16, overflow: 'hidden' },
  sheet: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  originLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  originValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  section: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: '#163A8A', borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextOn: { color: colors.text, fontWeight: '600' },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: colors.danger, marginTop: 12 },
  weatherCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  weatherTitle: { color: colors.text, fontWeight: '700', marginBottom: 6 },
  weatherLine: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  weatherAdvice: { color: colors.text, marginTop: 8, fontSize: 13, lineHeight: 18 },
  meta: { color: '#6C6C70', marginTop: 6, fontSize: 12 },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  routeSelected: { borderColor: colors.accent },
  routeBlocked: { opacity: 0.55 },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  routeEta: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  routeDesc: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  warn: { color: '#FFD60A', fontSize: 12, marginTop: 2 },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
