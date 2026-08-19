import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { campusGraph } from '../data/campusMap';
import { haversineM } from './location';

export type ObstacleSeverity = 'low' | 'medium' | 'high';
export type ObstacleSource = 'community' | 'admin';

export type Obstacle = {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  severity: ObstacleSeverity;
  source: ObstacleSource;
  edgeIds: string[];
  photoUri?: string;
  createdAt: string;
  yesVotes: number;
  noVotes: number;
  localVoted?: 'yes' | 'no' | null;
};

const KEY = 'campus_obstacles_v4';
const VOTER_KEY = 'campus_obstacle_votes_v2';

/** Foto demo remota para que la UI siempre muestre evidencia en seeds. */
const DEMO_PHOTO =
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=60';

const seed: Obstacle[] = [
  {
    id: 'obs-seed-1',
    title: 'Charco profundo',
    description: 'Acumulación de agua cerca de Biblioteca.',
    category: 'charco',
    lat: -2.1472852,
    lng: -79.9661399,
    severity: 'medium',
    source: 'community',
    edgeIds: [],
    photoUri: DEMO_PHOTO,
    createdAt: new Date().toISOString(),
    yesVotes: 2,
    noVotes: 0,
    localVoted: null,
  },
  {
    id: 'obs-seed-2',
    title: 'Sendero con precaución',
    description: 'Tramo con mantenimiento cerca de FIEC. Ya tiene 2 “No”: un “No” más lo retira.',
    category: 'mantenimiento',
    lat: -2.1446222,
    lng: -79.9676414,
    severity: 'high',
    source: 'admin',
    edgeIds: [],
    photoUri: DEMO_PHOTO,
    createdAt: new Date().toISOString(),
    yesVotes: 1,
    noVotes: 2,
    localVoted: null,
  },
];

let cache: Obstacle[] | null = null;
let voteMap: Record<string, 'yes' | 'no'> = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeObstacles(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function loadVotes() {
  const raw = await AsyncStorage.getItem(VOTER_KEY);
  voteMap = raw ? (JSON.parse(raw) as Record<string, 'yes' | 'no'>) : {};
}

async function saveVotes() {
  await AsyncStorage.setItem(VOTER_KEY, JSON.stringify(voteMap));
}

function withLocalVote(list: Obstacle[]): Obstacle[] {
  return list
    .map((o) => ({
      ...o,
      yesVotes: o.yesVotes ?? 0,
      noVotes: o.noVotes ?? 0,
      localVoted: voteMap[o.id] ?? null,
    }))
    .filter((o) => (o.noVotes ?? 0) < 3);
}

async function load(): Promise<Obstacle[]> {
  if (cache) return withLocalVote(cache);
  await loadVotes();
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    cache = seed;
    await AsyncStorage.setItem(KEY, JSON.stringify(seed));
    return withLocalVote(cache);
  }
  cache = (JSON.parse(raw) as Obstacle[]).map((o) => ({
    ...o,
    yesVotes: o.yesVotes ?? 0,
    noVotes: o.noVotes ?? 0,
  }));
  cache = cache.filter((o) => (o.noVotes ?? 0) < 3);
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  return withLocalVote(cache);
}

async function save(next: Obstacle[]) {
  cache = next.filter((o) => (o.noVotes ?? 0) < 3);
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  emit();
}

async function persistPhoto(uri: string, id: string): Promise<string> {
  try {
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    const dir = `${FileSystem.documentDirectory}obstacles/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = `${dir}${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export async function listObstacles(): Promise<Obstacle[]> {
  return load();
}

export async function addObstacle(
  input: Omit<Obstacle, 'id' | 'createdAt' | 'yesVotes' | 'noVotes' | 'localVoted'>
): Promise<Obstacle> {
  const list = await load();
  const id = `obs-${Date.now()}`;
  let photoUri = input.photoUri;
  if (photoUri) {
    photoUri = await persistPhoto(photoUri, id);
  }
  const item: Obstacle = {
    ...input,
    id,
    photoUri,
    createdAt: new Date().toISOString(),
    yesVotes: 0,
    noVotes: 0,
    localVoted: null,
  };
  await save([item, ...list]);
  return item;
}

/** Confirma o niega permanencia. 3 negaciones eliminan el obstáculo. */
export async function voteObstaclePermanence(
  id: string,
  stillThere: boolean
): Promise<{ removed: boolean; obstacle: Obstacle | null }> {
  const list = await load();
  if (voteMap[id]) {
    const existing = list.find((o) => o.id === id) ?? null;
    return { removed: false, obstacle: existing };
  }

  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return { removed: true, obstacle: null };

  const item = { ...list[idx] };
  if (stillThere) item.yesVotes = (item.yesVotes ?? 0) + 1;
  else item.noVotes = (item.noVotes ?? 0) + 1;

  voteMap[id] = stillThere ? 'yes' : 'no';
  await saveVotes();

  if ((item.noVotes ?? 0) >= 3) {
    const next = list.filter((o) => o.id !== id);
    await save(next);
    return { removed: true, obstacle: null };
  }

  const next = [...list];
  next[idx] = item;
  await save(next);
  return { removed: false, obstacle: { ...item, localVoted: voteMap[id] } };
}

function edgesNearPoint(lat: number, lng: number, radiusM = 90) {
  const nodeMap = new Map(campusGraph.nodes.map((n) => [n.id, n]));
  return campusGraph.edges
    .filter((e) => {
      const a = nodeMap.get(e.from);
      const b = nodeMap.get(e.to);
      if (!a || !b) return false;
      const d = Math.min(haversineM({ lat, lng }, a), haversineM({ lat, lng }, b));
      return d <= radiusM;
    })
    .map((e) => e.id);
}

export function resolveEdgeIdsForObstacle(lat: number, lng: number) {
  return edgesNearPoint(lat, lng);
}

export function obstacleBlocksEdge(obstacles: Obstacle[], edgeId: string) {
  const nodeMap = new Map(campusGraph.nodes.map((n) => [n.id, n]));
  const edge = campusGraph.edges.find((e) => e.id === edgeId);
  if (!edge) {
    return obstacles.some((o) => o.severity !== 'low' && o.edgeIds.includes(edgeId));
  }
  const a = nodeMap.get(edge.from);
  const b = nodeMap.get(edge.to);
  if (!a || !b) return false;

  return obstacles.some((o) => {
    if (o.severity === 'low') return false;
    if ((o.noVotes ?? 0) >= 3) return false;
    if (o.edgeIds.includes(edgeId)) return true;
    return (
      haversineM(o, a) <= 90 ||
      haversineM(o, b) <= 90 ||
      haversineM(o, { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }) <= 90
    );
  });
}
