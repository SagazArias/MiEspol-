import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminNotices } from '../data/notices';
import {
  listObstacles,
  subscribeObstacles,
  voteObstaclePermanence,
  type Obstacle,
} from '../services/obstacles';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AlertasScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listObstacles().then(setObstacles);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return subscribeObstacles(refresh);
    }, [refresh])
  );

  const onVote = async (id: string, stillThere: boolean) => {
    const res = await voteObstaclePermanence(id, stillThere);
    if (res.removed) {
      Alert.alert(
        'Obstáculo retirado',
        'Alcanzó 3 confirmaciones de que ya no está. Se eliminó de la lista.'
      );
    } else if (!stillThere) {
      Alert.alert('Gracias', 'Tu “No” quedó registrado. Con 3 negaciones se retira.');
    } else {
      Alert.alert('Gracias', 'Confirmaste que el obstáculo sigue ahí.');
    }
    refresh();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Alertas del campus</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Avisos administrativos</Text>
        {adminNotices.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.cardTitle}>{n.title}</Text>
            <Text style={styles.cardBody}>{n.body}</Text>
          </View>
        ))}

        <Text style={styles.section}>Obstáculos reportados</Text>
        {obstacles.length === 0 ? (
          <Text style={styles.empty}>No hay obstáculos activos.</Text>
        ) : null}
        {obstacles.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.tag}>{o.source === 'admin' ? 'Admin' : 'Comunidad'}</Text>
            </View>
            <Text style={styles.cardBody}>{o.description}</Text>

            {o.photoUri ? (
              <Pressable onPress={() => setPreviewUri(o.photoUri!)}>
                <Image source={{ uri: o.photoUri }} style={styles.photo} resizeMode="cover" />
                <Text style={styles.photoHint}>Toca la imagen para ampliar</Text>
              </Pressable>
            ) : (
              <View style={styles.noPhoto}>
                <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                <Text style={styles.noPhotoText}>Sin fotografía adjunta</Text>
              </View>
            )}

            <Text style={styles.meta}>
              {o.category} · severidad {o.severity}
            </Text>
            <Text style={styles.votes}>
              Permanencia: Sí {o.yesVotes ?? 0} · No {o.noVotes ?? 0}/3 para retirar
            </Text>

            <Text style={styles.votePrompt}>¿El obstáculo sigue ahí?</Text>
            {o.localVoted ? (
              <Text style={styles.votedNote}>
                Ya votaste: {o.localVoted === 'yes' ? 'Sí, sigue' : 'No, ya no está'}
              </Text>
            ) : (
              <View style={styles.voteRow}>
                <Pressable style={[styles.voteBtn, styles.yesBtn]} onPress={() => onVote(o.id, true)}>
                  <Text style={styles.voteBtnText}>Sí</Text>
                </Pressable>
                <Pressable style={[styles.voteBtn, styles.noBtn]} onPress={() => onVote(o.id, false)}>
                  <Text style={styles.voteBtnText}>No</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate('ReportObstacle')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Nuevo reporte</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={!!previewUri} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.modalImg} resizeMode="contain" />
          ) : null}
          <Text style={styles.modalClose}>Toca para cerrar</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  content: { padding: 16, paddingBottom: 120 },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  empty: { color: colors.textMuted, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: colors.text, fontWeight: '700', flex: 1 },
  cardBody: { color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: colors.surfaceElevated,
  },
  photoHint: { color: '#6C6C70', fontSize: 11, marginTop: 4 },
  noPhoto: {
    marginTop: 10,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noPhotoText: { color: colors.textMuted, fontSize: 12 },
  meta: { color: '#6C6C70', marginTop: 8, fontSize: 12 },
  votes: { color: colors.textMuted, marginTop: 4, fontSize: 12, fontWeight: '600' },
  tag: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  votePrompt: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  voteRow: { flexDirection: 'row', gap: 10 },
  voteBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  yesBtn: { backgroundColor: '#1B5E20' },
  noBtn: { backgroundColor: '#7F1D1D' },
  voteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  votedNote: { color: colors.textMuted, fontSize: 13 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  modalImg: { width: '100%', height: '80%' },
  modalClose: { color: '#fff', textAlign: 'center', marginTop: 12 },
});
