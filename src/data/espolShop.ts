export type ShopReward = {
  id: string;
  title: string;
  category: 'gorra' | 'termo' | 'cuaderno' | 'bolso';
  discountPct: number;
  minPoints: number;
  description: string;
};

export const espolShopRewards: ShopReward[] = [
  {
    id: 's1',
    title: 'Gorra ESPOL clásica',
    category: 'gorra',
    discountPct: 10,
    minPoints: 80,
    description: 'Gorra oficial ESPOL — descuento en tienda física.',
  },
  {
    id: 's2',
    title: 'Gorra premium campus',
    category: 'gorra',
    discountPct: 15,
    minPoints: 150,
    description: 'Modelo premium con logo bordado.',
  },
  {
    id: 's3',
    title: 'Termo acero 500 ml',
    category: 'termo',
    discountPct: 12,
    minPoints: 120,
    description: 'Termo reutilizable ESPOL Shop.',
  },
  {
    id: 's4',
    title: 'Termo edición eco',
    category: 'termo',
    discountPct: 20,
    minPoints: 220,
    description: 'Edición movilidad activa — doble pared.',
  },
  {
    id: 's5',
    title: 'Cuaderno A4 ESPOL',
    category: 'cuaderno',
    discountPct: 8,
    minPoints: 60,
    description: 'Cuaderno espiral tapa dura.',
  },
  {
    id: 's6',
    title: 'Set cuadernos x3',
    category: 'cuaderno',
    discountPct: 18,
    minPoints: 180,
    description: 'Pack de 3 cuadernos rayados.',
  },
  {
    id: 's7',
    title: 'Bolso tote ESPOL',
    category: 'bolso',
    discountPct: 25,
    minPoints: 280,
    description: 'Tote de lona con logo institucional.',
  },
  {
    id: 's8',
    title: 'Mochila ESPOL Shop',
    category: 'bolso',
    discountPct: 35,
    minPoints: 450,
    description: 'Mochila campus — máximo descuento disponible.',
  },
];

export const mobilityBenefits = [
  {
    icon: 'heart' as const,
    text: 'Mejora tu salud cardiovascular con 20–30 min diarios de caminata.',
  },
  {
    icon: 'leaf' as const,
    text: 'Reduce tu huella de carbono evitando el bus en trayectos cortos.',
  },
  {
    icon: 'sunny' as const,
    text: 'Aprovecha el sol de Guayaquil con rutas con sombra inteligente.',
  },
  {
    icon: 'bicycle' as const,
    text: 'En bici recorres el campus más rápido y sumas pasos equivalentes.',
  },
  {
    icon: 'flash' as const,
    text: 'Más energía y concentración para clases y exámenes.',
  },
];
