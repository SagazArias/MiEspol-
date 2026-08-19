import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertasScreen } from './src/screens/AlertasScreen';
import { CarnetScreen } from './src/screens/CarnetScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ModulePlaceholderScreen } from './src/screens/ModulePlaceholderScreen';
import { GanadoresPremiosScreen } from './src/screens/GanadoresPremiosScreen';
import { NavegacionIncentivosScreen } from './src/screens/NavegacionIncentivosScreen';
import { PerfilScreen } from './src/screens/PerfilScreen';
import { ReportObstacleScreen } from './src/screens/ReportObstacleScreen';
import { RutaInteligenteScreen } from './src/screens/RutaInteligenteScreen';
import { WalkNavigationScreen } from './src/screens/WalkNavigationScreen';
import { colors } from './src/theme/colors';
import type { RootStackParamList, TabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Alertas: 'notifications',
            Carnet: 'qr-code',
            Perfil: 'person-circle',
          };
          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconOn]}>
              <Ionicons name={map[route.name]} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Alertas" component={AlertasScreen} />
      <Tab.Screen name="Carnet" component={CarnetScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="ModulePlaceholder" component={ModulePlaceholderScreen} />
          <Stack.Screen name="RutaInteligente" component={RutaInteligenteScreen} />
          <Stack.Screen name="NavegacionIncentivos" component={NavegacionIncentivosScreen} />
          <Stack.Screen name="GanadoresPremios" component={GanadoresPremiosScreen} />
          <Stack.Screen name="ReportObstacle" component={ReportObstacleScreen} />
          <Stack.Screen name="WalkNavigation" component={WalkNavigationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 8,
    elevation: 12,
  },
  tabIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconOn: { backgroundColor: colors.surfaceElevated },
});
