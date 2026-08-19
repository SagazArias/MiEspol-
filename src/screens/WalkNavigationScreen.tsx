import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CampusMap } from '../components/CampusMap';
import { getDestination } from '../data/destinations';
import { registerValidatedWalk } from '../services/incentives';
import { haversineM, requestLocationPermission } from '../services/location';
import { listObstacles, subscribeObstacles } from '../services/obstacles';
import {
  recalculateFromGps,
  type LatLng,
  type RouteOptionKind,
} from '../services/routing';
import { fetchCampusWeather } from '../services/weather';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { formatMeters } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'WalkNavigation'>;

export function WalkNavigationScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { toId, optionLabel, kind, coordinates, distanceM } = route.params;
  const dest = getDestination(toId);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>(coordinates);
  const [plannedDistance, setPlannedDistance] = useState(distanceM);
  const [status, setStatus] = useState('Preparando GPS…');
  const [steps, setSteps] = useState(0);
  const [walkedM, setWalkedM] = useState(0);
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let ped: { remove: () => void } | null = null;

    (async () => {
      const ok = await requestLocationPermission();
      if (!ok) {
        setStatus('GPS denegado — puedes completar en modo demo');
      } else {
        setStatus('Navegando a pie por el campus…');
        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
            timeInterval: 2500,
          },
          (pos) => {
            const here = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUser(here);
            if (lastPos.current) {
              const d = haversineM(lastPos.current, here);
              if (d < 45) setWalkedM((v) => v + d);
            }
            lastPos.current = here;

            if (dest && haversineM(here, dest) < 50 && !finished.current) {
              finished.current = true;
              completeWalk(here);
            }
          }
        );
      }

      const pedAvailable = await Pedometer.isAvailableAsync();
      if (pedAvailable) {
        ped = Pedometer.watchStepCount((r) => setSteps(r.steps));
      }
    })();

    const unsub = subscribeObstacles(async () => {
      try {
        const here = lastPos.current;
        if (!here) return;
        const [weather, obstacles] = await Promise.all([
          fetchCampusWeather(),
          listObstacles(),
        ]);
        const opt = recalculateFromGps(
          here,
          toId,
          kind as RouteOptionKind,
          weather,
          obstacles
        );
        if (opt) {
          setRouteCoords(opt.coordinates);
          setPlannedDistance(opt.distanceM);
          setAlertMsg('Obstáculo detectado: ruta recalculada automáticamente.');
        }
      } catch {
        // ignore
      }
    });

    return () => {
      sub?.remove();
      ped?.remove();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toId, kind]);

  const completeWalk = async (here?: { lat: number; lng: number }) => {
    const credited = Math.max(walkedM, plannedDistance * 0.7, 80);
    const nearDest =
      here && dest ? haversineM(here, dest) < 80 : walkedM > 40 || plannedDistance > 0;
    const active = steps >= 15 || walkedM >= 50 || nearDest;
    if (!active) {
      Alert.alert(
        'Caminata no validada',
        'No se detectó movilidad a pie suficiente (pasos/GPS).'
      );
      return;
    }
    const state = await registerValidatedWalk(credited, {
      steps: Math.max(steps, Math.round(credited / 0.75)),
      destinationId: toId,
    });
    Alert.alert(
      '¡Llegaste!',
      `Se acreditaron puntos. Total: ${state.points} pts (nivel ${state.level}).`,
      [{ text: 'OK', onPress: () => navigation.navigate('NavegacionIncentivos') }]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>
          Hacia {dest?.name ?? toId} · {optionLabel}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <CampusMap
        user={user}
        destination={dest ? { lat: dest.lat, lng: dest.lng, name: dest.name } : null}
        route={routeCoords}
        followUser
      />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {alertMsg ? <Text style={styles.alert}>{alertMsg}</Text> : null}
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.stats}>
          Ruta ~{formatMeters(plannedDistance)} · Caminado {formatMeters(walkedM)} · Pasos{' '}
          {steps}
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.secondary}
            onPress={() => navigation.navigate('ReportObstacle')}
          >
            <Text style={styles.secondaryText}>Reportar obstáculo</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={() => completeWalk(user ?? undefined)}>
            <Text style={styles.primaryText}>Completar (demo)</Text>
          </Pressable>
        </View>
      </View>
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
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },
  panel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  alert: { color: '#FFD60A', marginBottom: 8, fontSize: 13 },
  status: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  stats: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  primary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
