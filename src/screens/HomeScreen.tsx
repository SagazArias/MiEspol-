import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModuleCard } from '../components/ModuleCard';
import { colors, moduleGradients } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { greetingForNow } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_1 = [
  {
    id: 'academico',
    title: 'Académico',
    icon: 'school' as const,
    gradient: moduleGradients.academico,
  },
  {
    id: 'calendario',
    title: 'Calendario',
    icon: 'calendar' as const,
    gradient: moduleGradients.calendario,
  },
  {
    id: 'bienestar',
    title: 'Bienestar',
    icon: 'heart' as const,
    gradient: moduleGradients.bienestar,
  },
  {
    id: 'certificados',
    title: 'Certificados',
    icon: 'ribbon' as const,
    gradient: moduleGradients.certificados,
  },
  {
    id: 'restaurantes',
    title: 'Restaurantes',
    icon: 'restaurant' as const,
    gradient: moduleGradients.restaurantes,
  },
  {
    id: 'mapa',
    title: 'Mapa',
    icon: 'map' as const,
    gradient: moduleGradients.mapa,
  },
];

const PAGE_2 = [
  {
    id: 'ruta',
    title: 'Ruta Inteligente',
    icon: 'navigate' as const,
    gradient: moduleGradients.ruta,
    special: 'ruta' as const,
  },
  {
    id: 'navegacion',
    title: 'Navegación & Incentivos',
    icon: 'walk' as const,
    gradient: moduleGradients.navegacion,
    special: 'nav' as const,
  },
  {
    id: 'ganadores',
    title: 'Ganadores y Premios',
    icon: 'trophy' as const,
    gradient: moduleGradients.ganadores,
    special: 'ganadores' as const,
  },
];

const { width: SCREEN_W } = Dimensions.get('window');
const PAGE_PAD = 16;
const PAGE_W = SCREEN_W;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [page, setPage] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const greeting = useMemo(() => greetingForNow(), []);

  const openModule = (
    id: string,
    title: string,
    special?: 'ruta' | 'nav' | 'ganadores'
  ) => {
    if (special === 'ruta') {
      navigation.navigate('RutaInteligente');
      return;
    }
    if (special === 'nav') {
      navigation.navigate('NavegacionIncentivos');
      return;
    }
    if (special === 'ganadores') {
      navigation.navigate('GanadoresPremios');
      return;
    }
    navigation.navigate('ModulePlaceholder', { title, moduleId: id });
  };

  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / PAGE_W);
    if (next !== page) setPage(next);
  };

  const renderGrid = (
    modules: typeof PAGE_1 | typeof PAGE_2,
    pageIndex: number
  ) => (
    <View style={[styles.page, { width: PAGE_W }]}>
      <View style={[styles.grid, { paddingHorizontal: PAGE_PAD }]}>
        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            title={m.title}
            icon={m.icon}
            gradient={m.gradient}
            onPress={() =>
              openModule(m.id, m.title, 'special' in m ? m.special : undefined)
            }
          />
        ))}
        {pageIndex === 1
          ? Array.from({ length: 3 }).map((_, i) => (
              <View key={`ph-${i}`} style={styles.placeholderSlot} />
            ))
          : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>mi espol+</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Cámara">
            <Ionicons name="aperture-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Tabs', { screen: 'Alertas' })}
            accessibilityLabel="Notificaciones"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.badge} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#8E8E93" />
          </View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Campus inteligente ESPOL</Text>
        </View>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onPagerScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          style={styles.pager}
        >
          {renderGrid(PAGE_1, 0)}
          {renderGrid(PAGE_2, 1)}
        </ScrollView>

        <View style={styles.dots}>
          <View style={[styles.dot, page === 0 && styles.dotActive]} />
          <View style={[styles.dot, page === 1 && styles.dotActive]} />
        </View>

        <Text style={styles.hint}>
          Desliza el grid hacia la izquierda para ver Ruta Inteligente, Navegación &
          Incentivos y Ganadores y Premios.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  content: { paddingBottom: 120 },
  profile: { alignItems: 'center', marginTop: 18, marginBottom: 28 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  greeting: { color: colors.textMuted, fontSize: 22, fontWeight: '500' },
  subtitle: { color: '#6C6C70', fontSize: 13, marginTop: 4 },
  pager: { marginBottom: 8 },
  page: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeholderSlot: { width: '31%', aspectRatio: 0.92, marginBottom: 12 },
  dots: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  dot: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
  },
  dotActive: { backgroundColor: colors.accent, width: 28 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 28,
  },
});
