import graph from '../../assets/campus/graph.json';
import mapLayers from '../../assets/campus/map-layers.json';

export type GraphNode = {
  id: string;
  lat: number;
  lng: number;
  kind: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  distanceM: number;
  name: string;
  shade: number;
  heatExposure: number;
  pathCondition: number;
  covered: boolean;
  blocked: boolean;
};

export const campusGraph = graph as {
  destinations: { id: string; name: string; lat: number; lng: number }[];
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export const campusMapLayers = mapLayers as {
  destinations: { id: string; name: string; lat: number; lng: number }[];
  paths: { name: string; coordinates: [number, number][] }[];
  buildings: { name: string; coordinates: [number, number][] }[];
};
