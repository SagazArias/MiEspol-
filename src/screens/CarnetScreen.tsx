import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function CarnetScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Carnet / QR</Text>
      <View style={styles.card}>
        <View style={styles.qr}>
          <Ionicons name="qr-code" size={120} color={colors.text} />
        </View>
        <Text style={styles.name}>Estudiante ESPOL</Text>
        <Text style={styles.meta}>Prototipo MVP — identificador demo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  qr: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 6 },
});
