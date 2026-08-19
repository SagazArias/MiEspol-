import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModulePlaceholder'>;

export function ModulePlaceholderScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { title } = route.params;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>
        <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
        <Text style={styles.copy}>
          Módulo preservado del diseño Mi ESPOL. En este prototipo el foco está en
          Ruta Inteligente y Navegación & Incentivos.
        </Text>
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
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  copy: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
