// ===== TYPE DEFINITIONS =====

export interface Vec2 {
  x: number;
  y: number;
}

export type SlimeType =
  | 'pink'
  | 'tabby'
  | 'rock'
  | 'phosphor'
  | 'honey'
  | 'boom'
  | 'rad'
  | 'crystal'
  | 'golden'
  | 'tarr';

export type FoodType = 'carrot' | 'pogofruit' | 'cuberry' | 'mint_mango' | 'heart_beet' | 'odd_onion' | 'hen' | 'stony_hen' | 'briar_hen';

export type DietCategory = 'fruit' | 'vegetable' | 'meat' | 'everything';

export type BiomeType = 'ranch' | 'dry_reef' | 'moss_blanket' | 'indigo_quarry' | 'ancient_ruins' | 'glass_desert';

export type WeatherType = 'clear' | 'rain' | 'storm' | 'wind';

export type GameScreen = 'loading' | 'main_menu' | 'playing' | 'paused' | 'ranch_view' | 'market' | 'biome_select' | 'settings' | 'tutorial';

export interface SlimeData {
  type: SlimeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hunger: number; // 0-100
  happiness: number; // 0-100
  radius: number;
  color: string;
  secondaryColor?: string;
  glowColor?: string;
  diet: DietCategory;
  favoriteFood?: FoodType;
  plortValue: number;
  plortType: SlimeType;
  speed: number;
  bounceInterval: number;
  bounceTimer: number;
  isLargo: boolean;
  parentTypes?: [SlimeType, SlimeType];
  overfedTimer: number;
  sleeping: boolean;
  fleeing: boolean;
  fuseTimer: number;
  plortCooldown: number;
  wobblePhase: number;
  squashStretch: number;
  opacity: number;
  spawnTimer: number; // for golden slime
}

export interface FoodData {
  type: FoodType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  growthStage: number; // 0-1
  growthTimer: number;
  maxGrowthTime: number;
  dietCategory: DietCategory;
  color: string;
  radius: number;
  planted: boolean;
  mature: boolean;
}

export interface PlortData {
  slimeType: SlimeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  color: string;
  radius: number;
  sparkleTimer: number;
}

export interface PlayerData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  sprintSpeed: number;
  dashSpeed: number;
  dashCooldown: number;
  dashTimer: number;
  vacuumActive: boolean;
  blowerActive: boolean;
  vacuumCharge: number;
  vacuumOverheat: boolean;
  aimAngle: number;
  aimX: number;
  aimY: number;
  inventory: InventorySlot[];
  selectedSlot: number;
  newbucks: number;
  isSprinting: boolean;
  isDashing: boolean;
  dashDirection: Vec2;
  interactRange: number;
}

export interface InventorySlot {
  type: 'food' | 'plort' | 'slime';
  itemType: string;
  count: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'heart' | 'smoke' | 'dust' | 'slime_drip' | 'star' | 'rain' | 'snow';
  gravity: number;
}

export interface BiomeData {
  type: BiomeType;
  name: string;
  width: number;
  height: number;
  bgImage: string;
  unlockCost: number;
  slimeTypes: SlimeType[];
  foodTypes: FoodType[];
  waterAreas: WaterArea[];
  obstacles: Obstacle[];
  spawnPoints: Vec2[];
  slugSpawns: SlugSpawn[];
}

export interface WaterArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'tree' | 'crystal' | 'cliff';
}

export interface SlugSpawn {
  x: number;
  y: number;
  slimeType: SlimeType;
  interval: number;
  timer: number;
}

export interface DayNightCycle {
  time: number; // 0-1, where 0=dawn, 0.5=noon, 0.75=dusk, 1=midnight
  day: number;
  cycleDuration: number; // 20 minutes in ms
  isDay: boolean;
  isDusk: boolean;
  isNight: boolean;
  skyColor: string;
  lightIntensity: number;
}

export interface WeatherState {
  current: WeatherType;
  transitionTimer: number;
  windDirection: Vec2;
  windStrength: number;
  nextWeatherCheck: number;
  rainIntensity: number;
}

export interface CorralData {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  slimes: string[]; // slime ids
  upgrades: string[];
  hasAutoFeeder: boolean;
  hasPlortCollector: boolean;
  hasHighWalls: boolean;
  hasAirNet: boolean;
  hasMusicBox: boolean;
}

export interface RanchData {
  corrals: CorralData[];
  gardens: GardenPlot[];
  upgrades: string[];
  newbucks: number;
}

export interface GardenPlot {
  x: number;
  y: number;
  foodType: FoodType | null;
  growth: number;
  maxGrowth: number;
}

export interface TraderData {
  id: string;
  name: string;
  x: number;
  y: number;
  offers: TradeOffer[];
  sprite: string;
  dialog: string[];
}

export interface TradeOffer {
  id: string;
  type: 'buy' | 'sell' | 'quest';
  itemType: string;
  itemCategory: 'plort' | 'food' | 'upgrade';
  quantity: number;
  price: number;
  accepted: boolean;
}

export interface SaveData {
  version: string;
  player: Partial<PlayerData>;
  ranch: RanchData;
  currentBiome: BiomeType;
  unlockedBiomes: BiomeType[];
  discoveredSlimes: SlimeType[];
  dayNight: Partial<DayNightCycle>;
  stats: GameStats;
  timestamp: number;
}

export interface GameStats {
  totalPlortsSold: number;
  totalNewbucksEarned: number;
  totalSlimesFed: number;
  largestRanch: number;
  playTime: number;
  goldenSlimesFound: number;
}

export interface GameState {
  screen: GameScreen;
  previousScreen: GameScreen;
  player: PlayerData;
  slimes: Map<string, SlimeData>;
  foods: Map<string, FoodData>;
  plorts: Map<string, PlortData>;
  particles: Particle[];
  currentBiome: BiomeData;
  dayNight: DayNightCycle;
  weather: WeatherState;
  ranch: RanchData;
  traders: TraderData[];
  camera: Vec2;
  cameraZoom: number;
  stats: GameStats;
  unlockedBiomes: BiomeType[];
  discoveredSlimes: SlimeType[];
  paused: boolean;
  showInventory: boolean;
  showMinimap: boolean;
  notifications: GameNotification[];
  screenshake: { intensity: number; duration: number; timer: number };
  goldenSlimeEvent: { active: boolean; timer: number; announcement: boolean };
}

export interface GameNotification {
  id: string;
  text: string;
  color: string;
  timer: number;
  maxTime: number;
}

// Slime configuration
export const SLIME_CONFIG: Record<SlimeType, {
  color: string;
  secondaryColor?: string;
  glowColor?: string;
  diet: DietCategory;
  favoriteFood?: FoodType;
  plortValue: number;
  speed: number;
  radius: number;
  special?: string;
}> = {
  pink: { color: '#FF69B4', diet: 'everything', plortValue: 10, speed: 80, radius: 20 },
  tabby: { color: '#A0A0A0', secondaryColor: '#606060', diet: 'meat', favoriteFood: 'stony_hen', plortValue: 22, speed: 100, radius: 20, special: 'pounce' },
  rock: { color: '#808080', secondaryColor: '#505050', diet: 'vegetable', favoriteFood: 'heart_beet', plortValue: 30, speed: 60, radius: 22, special: 'spikes' },
  phosphor: { color: '#40E0D0', glowColor: '#20C0B0', diet: 'fruit', favoriteFood: 'cuberry', plortValue: 45, speed: 70, radius: 19, special: 'glow_fly' },
  honey: { color: '#DAA520', secondaryColor: '#B8860B', diet: 'fruit', favoriteFood: 'mint_mango', plortValue: 55, speed: 50, radius: 21, special: 'attract' },
  boom: { color: '#FF4500', secondaryColor: '#FF6347', diet: 'meat', favoriteFood: 'briar_hen', plortValue: 65, speed: 120, radius: 21, special: 'explode' },
  rad: { color: '#7FFF00', glowColor: '#55DD00', diet: 'vegetable', plortValue: 85, speed: 55, radius: 22, special: 'radiation' },
  crystal: { color: '#9370DB', secondaryColor: '#7B68EE', diet: 'vegetable', plortValue: 100, speed: 65, radius: 21, special: 'shards' },
  golden: { color: '#FFD700', glowColor: '#FFA500', diet: 'everything', plortValue: 500, speed: 250, radius: 18, special: 'flee_drop' },
  tarr: { color: '#2D004D', secondaryColor: '#FF0000', diet: 'meat', plortValue: 0, speed: 150, radius: 22, special: 'eat_slimes' },
};

// Food configuration
export const FOOD_CONFIG: Record<FoodType, {
  color: string;
  dietCategory: DietCategory;
  growthTime: number; // seconds
  radius: number;
}> = {
  carrot: { color: '#FF8C00', dietCategory: 'vegetable', growthTime: 120, radius: 8 },
  pogofruit: { color: '#FF69B4', dietCategory: 'fruit', growthTime: 180, radius: 8 },
  cuberry: { color: '#87CEEB', dietCategory: 'fruit', growthTime: 150, radius: 7 },
  mint_mango: { color: '#98FB98', dietCategory: 'fruit', growthTime: 200, radius: 9 },
  heart_beet: { color: '#DC143C', dietCategory: 'vegetable', growthTime: 240, radius: 8 },
  odd_onion: { color: '#DDA0DD', dietCategory: 'vegetable', growthTime: 180, radius: 7 },
  hen: { color: '#FFFFFF', dietCategory: 'meat', growthTime: 300, radius: 10 },
  stony_hen: { color: '#C0C0C0', dietCategory: 'meat', growthTime: 360, radius: 10 },
  briar_hen: { color: '#8B4513', dietCategory: 'meat', growthTime: 360, radius: 10 },
};

// Biome configuration
export const BIOME_CONFIG: Record<BiomeType, {
  name: string;
  bgImage: string;
  unlockCost: number;
  slimeTypes: SlimeType[];
  foodTypes: FoodType[];
  width: number;
  height: number;
}> = {
  ranch: {
    name: 'The Ranch',
    bgImage: '/assets/backgrounds/ranch_bg.jpg',
    unlockCost: 0,
    slimeTypes: ['pink', 'tabby'],
    foodTypes: ['carrot', 'pogofruit'],
    width: 2000,
    height: 2000,
  },
  dry_reef: {
    name: 'Dry Reef',
    bgImage: '/assets/backgrounds/dry_reef_bg.jpg',
    unlockCost: 500,
    slimeTypes: ['rock', 'phosphor', 'pink', 'tabby'],
    foodTypes: ['carrot', 'pogofruit', 'heart_beet'],
    width: 2500,
    height: 2500,
  },
  moss_blanket: {
    name: 'Moss Blanket',
    bgImage: '/assets/backgrounds/moss_blanket_bg.jpg',
    unlockCost: 1500,
    slimeTypes: ['honey', 'boom', 'tabby'],
    foodTypes: ['mint_mango', 'pogofruit'],
    width: 2500,
    height: 2500,
  },
  indigo_quarry: {
    name: 'Indigo Quarry',
    bgImage: '/assets/backgrounds/indigo_quarry_bg.jpg',
    unlockCost: 3000,
    slimeTypes: ['rock', 'crystal', 'rad'],
    foodTypes: ['odd_onion', 'heart_beet'],
    width: 2500,
    height: 2500,
  },
  ancient_ruins: {
    name: 'Ancient Ruins',
    bgImage: '/assets/backgrounds/ancient_ruins_bg.jpg',
    unlockCost: 6000,
    slimeTypes: ['crystal', 'boom', 'honey'],
    foodTypes: ['cuberry', 'odd_onion'],
    width: 3000,
    height: 3000,
  },
  glass_desert: {
    name: 'Glass Desert',
    bgImage: '/assets/backgrounds/glass_desert_bg.jpg',
    unlockCost: 10000,
    slimeTypes: ['crystal', 'boom', 'rad'],
    foodTypes: ['heart_beet', 'mint_mango'],
    width: 3000,
    height: 3000,
  },
};
