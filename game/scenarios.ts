import { MAP_RADIUS, MAX_DAYS } from '../constants';
import { HexCell, RunConfig, ScenarioId, TerrainType, Weather } from '../types';
import { randomUnit } from './random';

export interface ScenarioDescription {
  id: ScenarioId;
  title: string;
  question: string;
  predictionPrompt: string;
  controlLabel: string;
  interventionLabel: string;
  description: string;
  changedFactor: string;
}

export const DEFAULT_CONFIG: RunConfig = {
  scenarioId: 'flower-strips', treatment: 'control', seed: 'hau-ecology-01', trial: 1
};

export const SCENARIOS: Record<ScenarioId, ScenarioDescription> = {
  'flower-strips': {
    id: 'flower-strips', title: 'Flower strips and foraging',
    question: 'Do extra flowers along a corridor increase resources gathered and reproductive output?',
    predictionPrompt: 'Predict how adding flowers will change resources gathered and reproductive output.',
    controlLabel: 'No corridor flowers', interventionLabel: 'Flowering corridor',
    description: 'A fixed meadow corridor leads west from the nest to an outer flower patch. The intervention adds flowers along this corridor; the landscape, roads and exposure remain unchanged.',
    changedFactor: 'Floral supply along five fixed corridor cells; habitat and hazards are held constant.'
  },
  pesticide: {
    id: 'pesticide', title: 'Pesticide exposure',
    question: 'Does reduced exposure affect survival, movement costs or reproductive resources most?',
    predictionPrompt: 'Predict which outcome will respond most to lower pesticide exposure.',
    controlLabel: 'Baseline exposure', interventionLabel: 'Reduced exposure',
    description: 'Both conditions have the same flowers, aphid patches, roads and weather. The intervention reduces each exposed tile to one quarter of its baseline pesticide level.',
    changedFactor: 'Pesticide levels only: 25% of the control value in the intervention.'
  },
  hoverfly: {
    id: 'hoverfly', title: 'Flowers near aphid patches',
    question: 'Do flowers near aphid patches increase hoverfly reproductive output?',
    predictionPrompt: 'Predict how nearby larval food will change the reproductive benefit of floral feeding.',
    controlLabel: 'Flowers farther from aphids', interventionLabel: 'Flowers near aphids',
    description: 'Four equal floral patches are placed either far from or close to two fixed aphid patches. Total floral supply, habitat types, pesticide levels and roads are identical between conditions.',
    changedFactor: 'The position of four floral patches; their total resource quality is conserved.'
  }
};

export const normaliseConfig = (input: Partial<RunConfig> = {}): RunConfig => {
  const scenarioId = input.scenarioId && Object.prototype.hasOwnProperty.call(SCENARIOS, input.scenarioId)
    ? input.scenarioId : DEFAULT_CONFIG.scenarioId;
  const seed = typeof input.seed === 'string' ? input.seed.trim().slice(0, 64) : '';
  const trial = typeof input.trial === 'number' && Number.isFinite(input.trial)
    ? Math.max(1, Math.min(999999, Math.floor(input.trial))) : DEFAULT_CONFIG.trial;
  return {
    scenarioId,
    treatment: input.treatment === 'intervention' ? 'intervention' : 'control',
    seed: seed || DEFAULT_CONFIG.seed,
    trial
  };
};

const distanceFromNest = (q: number, r: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
const coordinateKey = (q: number, r: number) => `${q},${r}`;
const hasFloralHabitat = (type: TerrainType) =>
  [TerrainType.MEADOW, TerrainType.FOREST, TerrainType.CROP, TerrainType.URBAN].includes(type);

const baselineMap = (seed: string): Map<string, HexCell> => {
  const map = new Map<string, HexCell>();
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    const firstR = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
    const lastR = Math.min(MAP_RADIUS, -q + MAP_RADIUS);
    for (let r = firstR; r <= lastR; r++) {
      const key = coordinateKey(q, r);
      const terrainRoll = randomUnit(seed, 'map', `${key}:terrain`);
      let type = terrainRoll < 0.4 ? TerrainType.MEADOW
        : terrainRoll < 0.55 ? TerrainType.FOREST
          : terrainRoll < 0.7 ? TerrainType.URBAN
            : terrainRoll < 0.94 ? TerrainType.CROP : TerrainType.WATER;
      if (q === 2) type = TerrainType.ROAD;
      if (q === 0 && r === 0) type = TerrainType.NEST;
      const qualityRoll = randomUnit(seed, 'map', `${key}:quality`);
      const resourceQuality = type === TerrainType.FOREST ? 35 + Math.floor(qualityRoll * 30)
        : type === TerrainType.MEADOW ? 60 + Math.floor(qualityRoll * 30)
          : type === TerrainType.CROP ? 65 + Math.floor(qualityRoll * 30)
            : type === TerrainType.URBAN ? 50 + Math.floor(qualityRoll * 40) : 0;
      const managed = randomUnit(seed, 'map', `${key}:managed`);
      const exposure = randomUnit(seed, 'map', `${key}:exposure`);
      const pesticideLevel = type === TerrainType.CROP && managed < 0.6 ? 0.2 + exposure * 0.6
        : type === TerrainType.URBAN && managed < 0.3 ? exposure * 0.3 : 0;
      map.set(key, {
        q, r, type, resourceQuality, pesticideLevel,
        isRevealed: distanceFromNest(q, r) <= 1,
        hasForagedToday: false, lastForagedDay: null,
        aphids: type === TerrainType.CROP && randomUnit(seed, 'map', `${key}:aphids`) < 0.35,
        flowerStrip: false
      });
    }
  }
  return map;
};

const setCell = (map: Map<string, HexCell>, q: number, r: number, changes: Partial<HexCell>) => {
  const key = coordinateKey(q, r);
  const cell = map.get(key);
  if (!cell) throw new Error(`Scenario cell (${key}) is outside the map.`);
  map.set(key, { ...cell, ...changes });
};

const STARTER_FLOWER = [0, -1] as const;
const GARDEN_SHELTER = [1, -1] as const;
export const APHID_PATCHES = [[3, -2], [-3, 2]] as const;
export const FLOWER_CORRIDOR = [[-1, 0], [-2, 0], [-3, 0], [-4, 0], [-5, 0]] as const;
export const NEAR_APHID_FLOWERS = [[3, -3], [4, -3], [-3, 1], [-4, 2]] as const;
export const FAR_APHID_FLOWERS = [[0, -5], [1, -5], [0, 5], [-1, 5]] as const;

/** Pure environment generation. Trial labels and treatments never enter random
 * keys: a paired comparison shares all background conditions and weather. */
export const createScenario = (input: Partial<RunConfig> = {}): { map: Map<string, HexCell>; weatherSchedule: Weather[] } => {
  const config = normaliseConfig(input);
  const map = baselineMap(config.seed);
  setCell(map, ...STARTER_FLOWER, { type: TerrainType.MEADOW, resourceQuality: 80, pesticideLevel: 0, aphids: false });
  setCell(map, ...GARDEN_SHELTER, { type: TerrainType.URBAN, resourceQuality: 65, pesticideLevel: 0, aphids: false });
  // A known nearby crop supports an early comparison without searching the whole map.
  setCell(map, -1, 1, { type: TerrainType.CROP, resourceQuality: 80, pesticideLevel: 0.6, aphids: config.scenarioId !== 'hoverfly' });
  for (const [q, r] of APHID_PATCHES) {
    setCell(map, q, r, { type: TerrainType.CROP, resourceQuality: 0, pesticideLevel: 0.25, aphids: true });
  }

  if (config.scenarioId === 'flower-strips') {
    for (const [q, r] of FLOWER_CORRIDOR) {
      setCell(map, q, r, {
        type: TerrainType.MEADOW, resourceQuality: config.treatment === 'intervention' ? 75 : 0,
        pesticideLevel: 0, aphids: false, flowerStrip: config.treatment === 'intervention'
      });
    }
    setCell(map, -6, 0, { type: TerrainType.MEADOW, resourceQuality: 90, pesticideLevel: 0, aphids: false });
  }

  if (config.scenarioId === 'hoverfly') {
    // Only the two designated aphid patches are used in this spatial experiment.
    for (const [key, cell] of map) map.set(key, { ...cell, aphids: false });
    for (const [q, r] of APHID_PATCHES) setCell(map, q, r, { aphids: true });
    for (const [q, r] of [...NEAR_APHID_FLOWERS, ...FAR_APHID_FLOWERS]) {
      setCell(map, q, r, { type: TerrainType.MEADOW, resourceQuality: 0, pesticideLevel: 0, aphids: false, flowerStrip: false });
    }
    const active = config.treatment === 'intervention' ? NEAR_APHID_FLOWERS : FAR_APHID_FLOWERS;
    for (const [q, r] of active) setCell(map, q, r, { resourceQuality: 75, flowerStrip: true });
  }

  if (config.scenarioId === 'pesticide' && config.treatment === 'intervention') {
    for (const [key, cell] of map) map.set(key, { ...cell, pesticideLevel: cell.pesticideLevel * 0.25 });
  }
  // Keep all non-floral terrain resource-free, including future scenario additions.
  for (const [key, cell] of map) {
    if (!hasFloralHabitat(cell.type)) map.set(key, { ...cell, resourceQuality: 0, aphids: false });
  }
  const weatherSchedule = Array.from({ length: MAX_DAYS }, (_, index) => {
    if (index === 0) return Weather.SUNNY;
    const roll = randomUnit(config.seed, 'weather', index + 1);
    return roll > 0.7 ? Weather.RAINY : roll > 0.4 ? Weather.CLOUDY : Weather.SUNNY;
  });
  return { map, weatherSchedule };
};
