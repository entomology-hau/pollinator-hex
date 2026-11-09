export enum TerrainType { MEADOW = 'MEADOW', FOREST = 'FOREST', CROP = 'CROP', URBAN = 'URBAN', WATER = 'WATER', NEST = 'NEST', ROAD = 'ROAD' }
export enum Weather { SUNNY = 'SUNNY', RAINY = 'RAINY', CLOUDY = 'CLOUDY' }
export enum SpeciesType { BUMBLEBEE = 'Bumblebee', SOLITARY_BEE = 'Solitary Bee', HOVERFLY = 'Hoverfly' }
export type ScenarioId = 'flower-strips' | 'pesticide' | 'hoverfly';
export type Treatment = 'control' | 'intervention';
export interface RunConfig { scenarioId: ScenarioId; treatment: Treatment; seed: string; trial: number }
export interface SpeciesStats {
  name: SpeciesType; description: string; maxEnergy: number; energyCostMove: number;
  energyCostForage: number; forageEfficiency: number; pesticideResilience: number;
  maxToxicity: number; flightRange: number; traits: string[];
}
export interface HexCell {
  q: number; r: number; type: TerrainType; isRevealed: boolean;
  hasForagedToday: boolean; lastForagedDay: number | null;
  pesticideLevel: number; resourceQuality: number;
  aphids: boolean; flowerStrip: boolean;
}
export interface RunMetrics {
  distance: number; forageVisits: number; exposureEvents: number; toxicityAccumulated: number;
  collisions: number; energySpent: number; completedDays: number;
}
export interface GameState {
  status: 'MENU' | 'PLAYING' | 'GAME_OVER'; day: number; weather: Weather;
  species: SpeciesStats | null; config: RunConfig; weatherSchedule: Weather[];
  riskVisits: Record<string, number>; metrics: RunMetrics;
  player: {
    energy: number; pollen: number; toxicity: number;
    q: number; r: number; isAlive: boolean; deathReason?: string;
    history: { day: number; event: string }[];
  };
  map: Map<string, HexCell>;
}
export interface TrialResult {
  id: string; modelVersion: string; finishedAt: string; config: RunConfig; species: SpeciesType;
  survived: boolean; dayReached: number; completedDays: number; causeOfDeath: string;
  resourcesCollected: number; score: number; scoreLabel: string;
  /** Retained only when reading saved results from the previous model. */
  carriedPollen?: number; deliveredPollen?: number; floralReserve?: number; ovipositionBatches?: number;
  energyRemaining: number; toxicity: number; metrics: RunMetrics;
  settings: string; weatherSchedule: Weather[]; history: { day: number; event: string }[];
}
export interface EcologicalReport { survivalAnalysis: string; strategyFeedback: string; score: number }
