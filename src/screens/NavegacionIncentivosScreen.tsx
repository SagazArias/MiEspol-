import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  bracketLegend,
  buildLeaderboard,
  getIncentives,
  getMissions,
  rankingResetHint,
  rewardsCatalog,
  subscribeIncentives,
  yourRank,
  type IncentivesState,
  type Mission,
} from '../services/incentives';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { formatMeters } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'NavegacionIncentivos'>;

export function NavegacionIncentivosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<IncentivesState | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);

  const refresh = useCallback(async () => {
    const s = await getIncentives();
    setState(s);
    setMissions(await getMissions(s));
  }, []);

  useEffect(() => {
    refresh();
    return subscribeIncentives(() => {
      refresh();
    });
  }, [refresh]);

  const board = state ? buildLeaderboard(state) : [];
  const rank = state ? yourRank(state) : 0;
  const daily = missions.filter((m) => m.type === 'daily');
  const weekly = missions.filter((m) => m.type === 'weekly');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Navegación & Incentivos</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Movilidad activa</Text>
          <Text style={styles.heroPoints}>{state?.points ?? 0} pts</Text>
          <Text style={styles.heroMeta}>
            Nivel {state?.level ?? 1} · {formatMeters(state?.totalDistanceM ?? 0)} ·{' '}
            {state?.walksCompleted ?? 0} caminatas
          </Text>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={22} color="#FF9F0A" />
            <Text style={styles.streakText}>
              Racha {state?.streak ?? 0} día{(state?.streak ?? 0) === 1 ? '' : 's'}
            </Text>
          </View>
          <Text style={styles.streakHint}>
            Enciende la racha 1 vez al día usando Ruta Inteligente o completando una misión.
          </Text>
        </View>

        <Text style={styles.section}>Clasificación semanal</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Posición actual: #{rank || '—'} · {state?.weeklySteps ?? 0} pasos esta semana
          </Text>
          <Text style={styles.resetHint}>{rankingResetHint()}</Text>
          {state?.lastWeeklyRewardNote ? (
            <Text style={styles.rewardNote}>{state.lastWeeklyRewardNote}</Text>
          ) : null}
          {board.map((e, i) => (
            <View
              key={e.id}
              style={[styles.rankRow, e.isYou && styles.rankYou]}
            >
              <Text style={styles.rankPos}>#{i + 1}</Text>
              <Text style={[styles.rankName, e.isYou && styles.rankNameYou]} numberOfLines={1}>
                {e.name}
              </Text>
              <Text style={styles.rankSteps}>{e.steps} pasos</Text>
            </View>
          ))}
          <Text style={styles.subSection}>Premios al reinicio (domingo 23:59)</Text>
          {bracketLegend().map((b) => (
            <Text key={b.range} style={styles.bracketLine}>
              {b.range}: +{b.points} pts
            </Text>
          ))}
        </View>

        <Text style={styles.section}>Misiones diarias</Text>
        {daily.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
        <Text style={styles.bonusLine}>Bonus por completar todas las diarias: +50 pts</Text>

        <Text style={styles.section}>Misiones semanales</Text>
        {weekly.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
        <Text style={styles.bonusLine}>Bonus por completar todas las semanales: +200 pts</Text>

        <Text style={styles.section}>Cómo funciona</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Planifica con Ruta Inteligente y completa la guía a pie. Los pasos suman al ranking;
            las misiones dan puntos extra aunque no estés en el top.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('RutaInteligente')}
          >
            <Text style={styles.primaryText}>Planificar e iniciar ruta</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Logros</Text>
        <View style={styles.rowWrap}>
          {(state?.achievements?.length ? state.achievements : ['Aún sin logros']).map(
            (a) => (
              <View key={a} style={styles.badge}>
                <Ionicons name="trophy-outline" size={14} color="#FFD60A" />
                <Text style={styles.badgeText}>{a}</Text>
              </View>
            )
          )}
        </View>

        <Text style={styles.section}>Recompensas canjeables</Text>
        {rewardsCatalog().map((r) => (
          <View key={r.id} style={styles.reward}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardTitle}>{r.title}</Text>
              <Text style={styles.rewardPlace}>{r.place}</Text>
            </View>
            <Text style={styles.rewardCost}>{r.cost} pts</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  return (
    <View style={[styles.mission, mission.done && styles.missionDone]}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionReward}>+{mission.reward} pts</Text>
      </View>
      <Text style={styles.missionDesc}>{mission.description}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.missionProgress}>
        {Math.min(mission.progress, mission.target)}/{mission.target}
        {mission.unit === 'meters'
          ? ' m'
          : mission.unit === 'steps'
            ? ' pasos'
            : mission.unit === 'destinations'
              ? ' facultades'
              : ''}
        {mission.done ? ' · Completada' : ''}
      </Text>
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
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroKicker: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  heroPoints: { color: colors.text, fontSize: 40, fontWeight: '800' },
  heroMeta: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  streakText: { color: '#FF9F0A', fontWeight: '800', fontSize: 16 },
  streakHint: { color: '#6C6C70', fontSize: 12, marginTop: 6, lineHeight: 16 },
  section: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subSection: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  cardText: { color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  resetHint: { color: colors.accent, fontSize: 12, marginBottom: 8 },
  rewardNote: { color: '#34C759', fontSize: 12, marginBottom: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  rankYou: { backgroundColor: '#163A8A44', marginHorizontal: -6, paddingHorizontal: 6, borderRadius: 8 },
  rankPos: { color: colors.textMuted, width: 36, fontWeight: '700' },
  rankName: { color: colors.text, flex: 1, fontSize: 13 },
  rankNameYou: { fontWeight: '800' },
  rankSteps: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  bracketLine: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  mission: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  missionDone: { borderWidth: 1, borderColor: '#34C759' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  missionTitle: { color: colors.text, fontWeight: '700', flex: 1 },
  missionReward: { color: colors.accent, fontWeight: '700' },
  missionDesc: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 8 },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: colors.accent },
  missionProgress: { color: '#6C6C70', fontSize: 11, marginTop: 6 },
  bonusLine: { color: '#FFD60A', fontSize: 12, marginBottom: 4, marginTop: -2 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { color: colors.text, fontSize: 12 },
  reward: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardTitle: { color: colors.text, fontWeight: '700' },
  rewardPlace: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rewardCost: { color: colors.accent, fontWeight: '700' },
});
