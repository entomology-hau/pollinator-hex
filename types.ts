
export enum TerrainType {
  MEADOW = 'MEADOW',
  FOREST = 'FOREST',
  CROP = 'CROP',
  URBAN = 'URBAN',
  WATER = 'WATER',
  NEST = 'NEST',
  ROAD = 'ROAD'
}

export enum Weather {
  SUNNY = 'SUNNY',
  RAINY = 'RAINY',
  CLOUDY = 'CLOUDY'
}

export enum SpeciesType {
  BUMBLEBEE = 'Bumblebee',
  SOLITARY_BEE = 'Solitary Bee',
  HOVERFLY = 'Hoverfly'
}

export interface SpeciesStats {
  name: SpeciesType;
  description: string;
  maxEnergy: number;
  energyCostMove: number;
  energyCostForage: number;
  forageEfficiency: number; // Multiplier for resources
  pesticideResilience: number; // 0-1, higher is better (reduces accumulation)
  maxToxicity: number; // Cumulative threshold before death
  flightRange: number; // Hex distance
  traits: string[];
}

export interface HexCell {
  q: number;
  r: number;
  type: TerrainType;
  isRevealed: boolean;
  hasForagedToday: boolean;
  lastForagedDay: number | null;
  pesticideLevel: number; // 0-1
  resourceQuality: number; // 0-100
}

export interface GameState {
  status: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'SUMMARY';
  day: number;
  weather: Weather;
  species: SpeciesStats | null;
  player: {
    energy: number;
    pollen: number; // Collected floral resource units: pollen for bees, nectar for hoverflies; an illustrative score input.
    toxicity: number; // Cumulative toxicity
    q: number;
    r: number;
    isAlive: boolean;
    deathReason?: string;
    history: { day: number; event: string }[];
  };
  map: Map<string, HexCell>; // Key is `${q},${r}`
}

export interface EcologicalReport {
  survivalAnalysis: string;
  strategyFeedback: string;
  score: number;
}

