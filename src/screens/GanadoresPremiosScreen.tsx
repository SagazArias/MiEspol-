import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { espolShopRewards, mobilityBenefits } from '../data/espolShop';
import {
  buildLeaderboard,
  getIncentives,
  rankingResetHint,
  subscribeIncentives,
  yourRank,
  type IncentivesState,
  type LeaderboardEntry,
} from '../services/incentives';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'GanadoresPremios'>;

const PODIUM = {
  gold: ['#FFD700', '#FFA500'],
  silver: ['#C0C0C0', '#808080'],
  bronze: ['#CD7F32', '#8B4513'],
};

function shortName(name: string) {
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : name;
}

function PodiumBlock({
  entry,
  place,
  height,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  height: number;
}) {
  const grad: [string, string] =
    place === 1 ? [PODIUM.gold[0], PODIUM.gold[1]] : place === 2 ? [PODIUM.silver[0], PODIUM.silver[1]] : [PODIUM.bronze[0], PODIUM.bronze[1]];
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';

  return (
    <View style={styles.podiumCol}>
      <Text style={styles.medal}>{medal}</Text>
      <Text style={[styles.podiumName, entry.isYou && styles.podiumNameYou]} numberOfLines={2}>
        {shortName(entry.name)}
      </Text>
      <Text style={styles.podiumSteps}>{entry.steps.toLocaleString()} pasos</Text>
      <LinearGradient
        colors={grad}
        style={[styles.podiumBar, { height, width: place === 1 ? 92 : 76 }]}
      >
        <Text style={styles.podiumPlace}>#{place}</Text>
      </LinearGradient>
    </View>
  );
}

export function GanadoresPremiosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<IncentivesState | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);

  const refresh = useCallback(async () => {
    setState(await getIncentives());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeIncentives(refresh);
  }, [refresh]);

  const board = state ? buildLeaderboard(state) : [];
  const rank = state ? yourRank(state) : 0;
  const top3 = board.slice(0, 3);
  const second = top3[1];
  const first = top3[0];
  const third = top3[2];
  const youEntry = board.find((e) => e.isYou);
  const inPodium = rank >= 1 && rank <= 3;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Ganadores y Premios</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Ranking semanal</Text>
        <Text style={styles.resetHint}>{rankingResetHint()}</Text>

        <View style={styles.podiumWrap}>
          <View style={styles.podiumRow}>
            {second ? <PodiumBlock entry={second} place={2} height={72} /> : <View style={styles.podiumGap} />}
            {first ? <PodiumBlock entry={first} place={1} height={100} /> : <View style={styles.podiumGap} />}
            {third ? <PodiumBlock entry={third} place={3} height={56} /> : <View style={styles.podiumGap} />}
          </View>
        </View>

        <View style={[styles.yourRankBox, inPodium && styles.yourRankHighlight]}>
          <Ionicons name="person-circle" size={28} color={colors.accent} />
          <View style={styles.yourRankText}>
            <Text style={styles.yourRankLabel}>Tu posición esta semana</Text>
            <Text style={styles.yourRankValue}>
              #{rank} · {youEntry?.steps.toLocaleString() ?? 0} pasos
            </Text>
            {inPodium ? (
              <Text style={styles.yourRankSub}>¡Estás en el podio! Sigue caminando para mantenerlo.</Text>
            ) : (
              <Text style={styles.yourRankSub}>
                Sube posiciones con Ruta Inteligente y caminatas validadas.
              </Text>
            )}
          </View>
        </View>

        <Pressable style={styles.rewardsCta} onPress={() => setRewardsOpen(true)}>
          <LinearGradient
            colors={['#FF6B6B', '#FFD93D', '#6BCB77']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardsGradient}
          >
            <View style={styles.rewardsCtaInner}>
              <Ionicons name="gift" size={36} color="#fff" />
              <View style={styles.rewardsCtaText}>
                <Text style={styles.rewardsCtaTitle}>Recompensas ESPOL Shop</Text>
                <Text style={styles.rewardsCtaSub}>
                  Descuentos del 5% al 35% · gorras, termos, cuadernos y bolsos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.bubbleWrap}>
          <View style={styles.bubble}>
            <View style={styles.bubbleHeader}>
              <Ionicons name="walk" size={22} color={colors.success} />
              <Text style={styles.bubbleTitle}>Beneficios de la movilidad activa</Text>
            </View>
            {mobilityBenefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name={b.icon} size={18} color={colors.accent} />
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bubbleTail} />
        </View>

        <Pressable
          style={styles.linkBtn}
          onPress={() => navigation.navigate('RutaInteligente')}
        >
          <Text style={styles.linkBtnText}>Ir a Ruta Inteligente</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={rewardsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ESPOL Shop — Descuentos</Text>
              <Pressable onPress={() => setRewardsOpen(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalNote}>
              Canjea con tus puntos acumulados. Solo descuentos en tienda — no incluye pago
              en la app.
            </Text>
            <ScrollView style={styles.modalScroll}>
              {espolShopRewards.map((r) => {
                const unlocked = (state?.points ?? 0) >= r.minPoints;
                return (
                  <View key={r.id} style={[styles.rewardCard, unlocked && styles.rewardUnlocked]}>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardDiscount}>-{r.discountPct}%</Text>
                    </View>
                    <View style={styles.rewardBody}>
                      <Text style={styles.rewardTitle}>{r.title}</Text>
                      <Text style={styles.rewardDesc}>{r.description}</Text>
                      <Text style={styles.rewardCost}>
                        {unlocked ? '✓ Disponible' : `Requiere ${r.minPoints} pts`}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        r.category === 'gorra'
                          ? 'shirt'
                          : r.category === 'termo'
                            ? 'water'
                            : r.category === 'cuaderno'
                              ? 'book'
                              : 'bag-handle'
                      }
                      size={28}
                      color={unlocked ? colors.success : colors.textMuted}
                    />
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.modalFooter}>
              Tienes {state?.points ?? 0} puntos · Nivel {state?.level ?? 1}
            </Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resetHint: { color: colors.accent, fontSize: 12, marginTop: 4, marginBottom: 16 },
  podiumWrap: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  podiumGap: { width: 76 },
  podiumCol: { alignItems: 'center', flex: 1, maxWidth: 110 },
  medal: { fontSize: 28, marginBottom: 4 },
  podiumName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    minHeight: 32,
  },
  podiumNameYou: { color: colors.accent },
  podiumSteps: { color: colors.textMuted, fontSize: 10, marginBottom: 8 },
  podiumBar: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumPlace: { color: '#1a1a1a', fontWeight: '900', fontSize: 18 },
  yourRankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yourRankHighlight: { borderColor: colors.accent, backgroundColor: '#163A8A33' },
  yourRankText: { flex: 1 },
  yourRankLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  yourRankValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  yourRankSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  rewardsCta: { borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
  rewardsGradient: { padding: 2 },
  rewardsCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 18,
  },
  rewardsCtaText: { flex: 1 },
  rewardsCtaTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  rewardsCtaSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4, lineHeight: 16 },
  bubbleWrap: { marginBottom: 20, alignItems: 'flex-start' },
  bubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.success,
  },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bubbleTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  benefitRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  benefitText: { color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 18 },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.success,
    marginLeft: 28,
    marginTop: -1,
  },
  linkBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  modalScroll: { maxHeight: 420 },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    opacity: 0.65,
  },
  rewardUnlocked: { opacity: 1, borderWidth: 1, borderColor: colors.success },
  rewardBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minWidth: 52,
    alignItems: 'center',
  },
  rewardDiscount: { color: '#fff', fontWeight: '900', fontSize: 16 },
  rewardBody: { flex: 1 },
  rewardTitle: { color: colors.text, fontWeight: '700' },
  rewardDesc: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rewardCost: { color: colors.accent, fontSize: 11, fontWeight: '600', marginTop: 4 },
  modalFooter: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
});
