import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { destinations } from '../data/destinations';
import { addObstacle, resolveEdgeIdsForObstacle } from '../services/obstacles';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportObstacle'>;

const CATEGORIES = [
  'charco',
  'lodo',
  'cierre',
  'árbol caído',
  'mantenimiento',
  'accidente',
  'otro',
];

export function ReportObstacleScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [nearId, setNearId] = useState(destinations[10].id);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const near = destinations.find((d) => d.id === nearId) ?? destinations[0];
  const lat = route.params?.presetLat ?? near.lat;
  const lng = route.params?.presetLng ?? near.lng;

  const pickPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Activa la cámara para adjuntar evidencia.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        allowsEditing: true,
      });
      if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Activa la galería para adjuntar evidencia.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: true,
      mediaTypes: ['images'],
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Faltan datos', 'Completa título y descripción.');
      return;
    }
    setSaving(true);
    try {
      const point = destinations.find((d) => d.id === nearId) ?? near;
      await addObstacle({
        title: title.trim(),
        description: description.trim(),
        category,
        lat: point.lat,
        lng: point.lng,
        severity: category === 'cierre' || category === 'accidente' ? 'high' : 'medium',
        source: 'community',
        edgeIds: resolveEdgeIdsForObstacle(point.lat, point.lng),
        photoUri,
      });
      Alert.alert('Reporte enviado', 'Gracias. La comunidad y rutas se actualizarán.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Reportar obstáculo</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Charco en cruce"
          placeholderTextColor="#6C6C70"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.area]}
          placeholder="Describe el problema y referencias cercanas"
          placeholderTextColor="#6C6C70"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipOn]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Cerca de</Text>
        <View style={styles.chips}>
          {destinations.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => setNearId(d.id)}
              style={[styles.chip, nearId === d.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, nearId === d.id && styles.chipTextOn]}>
                {d.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.meta}>
          Ubicación aprox.: {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>

        <Pressable style={styles.secondaryBtn} onPress={() => pickPhoto(true)}>
          <Ionicons name="camera" size={18} color={colors.text} />
          <Text style={styles.secondaryText}>
            {photoUri ? 'Nueva foto (cámara)' : 'Adjuntar foto (cámara)'}
          </Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={() => pickPhoto(false)}>
          <Ionicons name="images" size={18} color={colors.text} />
          <Text style={styles.secondaryText}>Elegir de galería</Text>
        </Pressable>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}

        <Pressable
          style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.primaryText}>
            {saving ? 'Enviando…' : 'Publicar reporte'}
          </Text>
        </Pressable>
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
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: colors.textMuted, marginBottom: 6, marginTop: 10, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  area: { minHeight: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: '#163A8A' },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextOn: { color: colors.text, fontWeight: '600' },
  meta: { color: '#6C6C70', marginTop: 12, marginBottom: 8, fontSize: 12 },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryText: { color: colors.text, fontWeight: '600' },
  photo: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
});
