import type { NavigatorScreenParams } from '@react-navigation/native';
import type { LatLng, RouteOptionKind } from '../services/routing';

export type TabParamList = {
  Home: undefined;
  Alertas: undefined;
  Carnet: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ModulePlaceholder: { title: string; moduleId: string };
  RutaInteligente: undefined;
  NavegacionIncentivos: undefined;
  GanadoresPremios: undefined;
  ReportObstacle: { presetLat?: number; presetLng?: number } | undefined;
  WalkNavigation: {
    toId: string;
    optionLabel: string;
    kind: RouteOptionKind;
    coordinates: LatLng[];
    distanceM: number;
  };
};
