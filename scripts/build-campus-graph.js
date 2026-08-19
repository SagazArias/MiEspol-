const fs = require('fs');

const destinations = [
  { id: 'cti', name: 'CTI', lat: -2.1458446, lng: -79.9489238 },
  { id: 'admisiones', name: 'Admisiones', lat: -2.1501606, lng: -79.9493357 },
  { id: 'fcv', name: 'FCV', lat: -2.1518773, lng: -79.9567078 },
  { id: 'residencias', name: 'Residencias', lat: -2.1536581, lng: -79.956962 },
  { id: 'fimcm', name: 'FIMCM', lat: -2.1468841, lng: -79.9628524 },
  { id: 'rectorado', name: 'Rectorado', lat: -2.1474978, lng: -79.9645096 },
  { id: 'biblioteca', name: 'Biblioteca', lat: -2.1472852, lng: -79.9661399 },
  { id: 'fcsh', name: 'FCSH', lat: -2.1477459, lng: -79.9687693 },
  { id: 'fcnm', name: 'FCNM', lat: -2.1468714, lng: -79.9671363 },
  { id: 'ubp', name: 'UBP', lat: -2.1429354, lng: -79.9671616 },
  { id: 'fiec', name: 'FIEC', lat: -2.1446222, lng: -79.9676414 },
  { id: 'fimcp', name: 'FIMCP', lat: -2.1444377, lng: -79.9659964 },
  { id: 'fict', name: 'FICT', lat: -2.1455118, lng: -79.9653321 },
  { id: 'fadcom', name: 'FADCOM', lat: -2.1440472, lng: -79.9624105 },
];

const paths = JSON.parse(fs.readFileSync('assets/campus/paths.geojson', 'utf8'));
const buildings = JSON.parse(fs.readFileSync('assets/campus/buildings.geojson', 'utf8'));

function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pathMeta(name) {
  const blocked = /⛔/.test(name);
  const caution = /⚠/.test(name);
  const covered = /ciclov|cubierto|pasarela/i.test(name);
  return {
    blocked,
    shade: covered ? 0.75 : caution ? 0.35 : 0.5,
    heatExposure: covered ? 0.3 : caution ? 0.7 : 0.55,
    pathCondition: blocked ? 0.2 : caution ? 0.45 : 0.85,
    covered,
  };
}

/** Simplify line: keep points ~every minDist meters */
function simplify(coords, minDist = 35) {
  if (!coords.length) return [];
  const out = [{ lng: coords[0][0], lat: coords[0][1] }];
  for (let i = 1; i < coords.length; i++) {
    const p = { lng: coords[i][0], lat: coords[i][1] };
    if (haversine(out[out.length - 1], p) >= minDist || i === coords.length - 1) {
      out.push(p);
    }
  }
  return out;
}

const nodes = [];
const edges = [];
const nodeIndex = new Map();

function addNode(id, lat, lng, kind = 'path') {
  if (nodeIndex.has(id)) return id;
  nodeIndex.set(id, nodes.length);
  nodes.push({ id, lat, lng, kind });
  return id;
}

function addEdge(from, to, meta, name) {
  const a = nodes[nodeIndex.get(from)];
  const b = nodes[nodeIndex.get(to)];
  const distanceM = haversine(a, b);
  if (distanceM < 1) return;
  const id = `${from}__${to}`;
  edges.push({
    id,
    from,
    to,
    distanceM,
    name,
    shade: meta.shade,
    heatExposure: meta.heatExposure,
    pathCondition: meta.pathCondition,
    covered: meta.covered,
    blocked: meta.blocked,
  });
}

for (const d of destinations) {
  addNode(d.id, d.lat, d.lng, 'destination');
}

let pathNodeSeq = 0;
for (const feature of paths.features) {
  const name = feature.properties.name || 'sendero';
  const meta = pathMeta(name);
  const pts = simplify(feature.geometry.coordinates, 40);
  const ids = pts.map((p) => {
    const id = `p${pathNodeSeq++}`;
    addNode(id, p.lat, p.lng, 'path');
    return id;
  });
  for (let i = 0; i < ids.length - 1; i++) {
    addEdge(ids[i], ids[i + 1], meta, name);
    addEdge(ids[i + 1], ids[i], meta, name);
  }
}

// Connect each destination to nearest path nodes (and lightly to other destinations)
for (const d of destinations) {
  const nearest = nodes
    .filter((n) => n.kind === 'path')
    .map((n) => ({ n, dist: haversine(d, n) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);
  for (const { n, dist } of nearest) {
    if (dist > 350) continue;
    const meta = {
      shade: 0.55,
      heatExposure: 0.5,
      pathCondition: 0.8,
      covered: false,
      blocked: false,
    };
    addEdge(d.id, n.id, meta, 'acceso');
    addEdge(n.id, d.id, meta, 'acceso');
  }
}

// Connect destinations that are close (campus plazas / short walks)
for (let i = 0; i < destinations.length; i++) {
  for (let j = i + 1; j < destinations.length; j++) {
    const a = destinations[i];
    const b = destinations[j];
    const dist = haversine(a, b);
    if (dist < 280) {
      const meta = {
        shade: 0.6,
        heatExposure: 0.45,
        pathCondition: 0.9,
        covered: false,
        blocked: false,
      };
      addEdge(a.id, b.id, meta, 'corto');
      addEdge(b.id, a.id, meta, 'corto');
    }
  }
}

// Destination building outlines only
const destBuildings = {
  type: 'FeatureCollection',
  features: buildings.features.filter((f) => {
    const n = (f.properties.name || '').toUpperCase();
    return (
      n.includes('CTI') ||
      n.includes('ADMISIONES') ||
      n.includes('FCV') ||
      n.includes('RESIDENCIA') ||
      n.includes('FIMCM') ||
      n.includes('RECTORADO') ||
      n.includes('BIBLIOTECA') ||
      n.includes('FCSH') ||
      n.includes('FCNM') ||
      n.includes('UBEP') ||
      n.includes('FIEC') ||
      n.includes('FIMCP') ||
      n.includes('FICT') ||
      n.includes('FADCOM')
    );
  }),
};

const graph = { destinations, nodes, edges };
fs.writeFileSync('assets/campus/graph.json', JSON.stringify(graph));
fs.writeFileSync('assets/campus/destinations.json', JSON.stringify(destinations, null, 2));
fs.writeFileSync('assets/campus/dest-buildings.geojson', JSON.stringify(destBuildings));
fs.writeFileSync(
  'assets/campus/map-layers.json',
  JSON.stringify({
    destinations,
    paths: paths.features.map((f) => ({
      name: f.properties.name,
      coordinates: f.geometry.coordinates,
    })),
    buildings: destBuildings.features.map((f) => ({
      name: f.properties.name,
      coordinates: f.geometry.coordinates[0],
    })),
  })
);

console.log({
  destinations: destinations.length,
  nodes: nodes.length,
  edges: edges.length,
  destBuildings: destBuildings.features.length,
});
