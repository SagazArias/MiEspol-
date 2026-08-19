import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getIncentives, type IncentivesState } from '../services/incentives';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { formatMeters } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [state, setState] = useState<IncentivesState | null>(null);

  useFocusEffect(
    useCallback(() => {
      getIncentives().then(setState);
    }, [])
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#8E8E93" />
        </View>
        <Text style={styles.name}>Estudiante ESPOL</Text>
        <Text style={styles.meta}>
          {state?.points ?? 0} pts · Nivel {state?.level ?? 1} ·{' '}
          {formatMeters(state?.totalDistanceM ?? 0)}
        </Text>
        <Text style={styles.meta}>
          Racha {state?.streak ?? 0} · {state?.weeklySteps ?? 0} pasos esta semana
        </Text>
      </View>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate('NavegacionIncentivos')}
      >
        <Text style={styles.btnText}>Ver incentivos y logros</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnAlt]}
        onPress={() => navigation.navigate('RutaInteligente')}
      >
        <Text style={styles.btnText}>Abrir Ruta Inteligente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 6 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnAlt: { backgroundColor: colors.surfaceElevated },
  btnText: { color: colors.text, fontWeight: '700' },
});
