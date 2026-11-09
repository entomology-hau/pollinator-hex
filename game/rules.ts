import {
  BUMBLEBEE_POLLEN_PER_WORKER_MG, CROP_ENERGY_BONUS, ENERGY_PER_RESOURCE, HOVERFLY_APHID_BONUS_MULTIPLIER, HOVERFLY_RESOURCES_PER_EGG,
  MAX_DAYS, OPEN_REST_RECOVERY, POLLEN_MG_PER_UNIT, RESOURCE_REGEN_DAYS, SHELTER_REST_RECOVERY, SOLITARY_POLLEN_PER_CELL_MG, START_ENERGY, WEATHER_EFFECTS
} from '../constants';
import { GameState, HexCell, RunConfig, SpeciesStats, SpeciesType, TerrainType, Weather } from '../types';
import { createScenario, DEFAULT_CONFIG, normaliseConfig } from './scenarios';
import { randomUnit } from './random';

export type RandomSource = () => number;
export interface HexCoordinate { q: number; r: number }
export interface MovePreview {
  valid: boolean; reason: string | null; distance: number; energyCost: number;
  /** Actual crossed roads; the interface must not disclose unrevealed terrain. */
  roadCrossings: number;
  /** Straight route, excluding the origin and including the destination. */
  path: HexCoordinate[];
}
export const RESOURCE_REGENERATION_DAYS = RESOURCE_REGEN_DAYS;
export const ROAD_COLLISION_CHANCE = 0.25;
export const ROAD_COLLISION_ENERGY_LOSS = 35;
export const NIGHT_PREDATION_CHANCE = 0.15;

const keyOf = ({ q, r }: HexCoordinate) => `${q},${r}`;
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(value, maximum));
const isPlaying = (state: GameState) => state.status === 'PLAYING' && state.player.isAlive && !!state.species;
const isHoverfly = (state: GameState) => state.species?.name === SpeciesType.HOVERFLY;

export const hexDistance = (from: HexCoordinate, to: HexCoordinate): number =>
  (Math.abs(from.q - to.q) + Math.abs(from.r - to.r) + Math.abs(from.q + from.r - to.q - to.r)) / 2;
const roundHex = (q: number, r: number): HexCoordinate => {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const qDiff = Math.abs(rq - q), rDiff = Math.abs(rr - r), sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq === 0 ? 0 : rq, r: rr === 0 ? 0 : rr };
};
export const traceHexPath = (from: HexCoordinate, to: HexCoordinate): HexCoordinate[] => {
  const distance = hexDistance(from, to);
  if (!Number.isInteger(distance) || distance === 0) return [];
  return Array.from({ length: distance }, (_, index) => {
    const t = (index + 1) / distance;
    return roundHex(from.q + (to.q - from.q) * t + 1e-6, from.r + (to.r - from.r) * t + 1e-6);
  });
};

export const createMap = (config: RunConfig = DEFAULT_CONFIG): Map<string, HexCell> => createScenario(normaliseConfig(config)).map;
export const createInitialState = (): GameState => ({
  status: 'MENU', day: 1, weather: Weather.SUNNY, species: null,
  config: { ...DEFAULT_CONFIG }, weatherSchedule: [], riskVisits: {},
  metrics: { distance: 0, forageVisits: 0, exposureEvents: 0, toxicityAccumulated: 0, collisions: 0, energySpent: 0, completedDays: 0 },
  player: {
    energy: START_ENERGY, pollen: 0, toxicity: 0,
    q: 0, r: 0, isAlive: true, history: []
  },
  map: new Map()
});
export const startGame = (species: SpeciesStats, config: RunConfig = DEFAULT_CONFIG): GameState => {
  const settings = normaliseConfig(config);
  const environment = createScenario(settings);
  const weather = environment.weatherSchedule[0];
  return {
    ...createInitialState(), status: 'PLAYING', species, config: settings, ...environment, weather,
    player: {
      ...createInitialState().player, energy: species.maxEnergy,
      history: [{ day: 1, event: `Season begins. Weather is ${weather.toLowerCase()}. Forage for food and reproductive resources.${species.name === SpeciesType.HOVERFLY ? ' Flowers near aphids give an automatic habitat bonus.' : ''}` }]
    }
  };
};
const log = (state: GameState, event: string): GameState => ({
  ...state, player: { ...state.player, history: [...state.player.history, { day: state.day, event }] }
});
const finishIfDead = (state: GameState, energyReason = 'Exhaustion'): GameState => {
  if (!state.species) return state;
  const energy = clamp(state.player.energy, state.species.maxEnergy);
  const toxicity = clamp(state.player.toxicity, state.species.maxToxicity);
  const deathReason = energy <= 0 ? energyReason : toxicity >= state.species.maxToxicity ? 'Pesticide Accumulation' : undefined;
  const next = { ...state, player: { ...state.player, energy, toxicity } };
  if (!deathReason) return next;
  return log({ ...next, status: 'GAME_OVER', player: { ...next.player, isAlive: false, deathReason } }, `Simulation ended: ${deathReason.toLowerCase()}.`);
};
export const estimateMoveCost = (state: GameState, distance: number): number => {
  if (!state.species) return 0;
  const impairment = state.player.toxicity > state.species.maxToxicity * 0.5 ? 1.5 : 1;
  return state.species.energyCostMove * distance * WEATHER_EFFECTS[state.weather].moveCostMult * impairment;
};
export const getMovePreview = (state: GameState, q: number, r: number): MovePreview => {
  const target = { q, r };
  const validCoordinates = Number.isInteger(q) && Number.isInteger(r);
  const distance = validCoordinates ? hexDistance(state.player, target) : 0;
  const path = validCoordinates && state.map.has(keyOf(target)) && distance <= (state.species?.flightRange ?? 0)
    ? traceHexPath(state.player, target) : [];
  const energyCost = estimateMoveCost(state, distance);
  let reason: string | null = null;
  if (!isPlaying(state)) reason = 'Start a simulation to move.';
  else if (!validCoordinates || !state.map.has(keyOf(target))) reason = 'Choose a tile within the landscape.';
  else if (distance === 0) reason = 'You are already on this tile.';
  else if (distance > state.species!.flightRange) reason = 'That tile is beyond your flight range.';
  else if (path.some(point => !state.map.has(keyOf(point)))) reason = 'There is no route through the landscape to that tile.';
  else if (state.player.energy < energyCost) reason = `Too tired to fly that far: this move needs ${energyCost.toFixed(1)} energy.`;
  return { valid: reason === null, reason, distance, energyCost, path,
    roadCrossings: path.filter(point => state.map.get(keyOf(point))?.type === TerrainType.ROAD).length };
};
const revealAt = (map: Map<string, HexCell>, { q, r }: HexCoordinate) => {
  const neighbours = [{ q, r }, { q: q + 1, r }, { q: q - 1, r }, { q, r: r + 1 }, { q, r: r - 1 }, { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 }];
  for (const point of neighbours) {
    const key = keyOf(point), cell = map.get(key);
    if (cell && !cell.isRevealed) map.set(key, { ...cell, isRevealed: true });
  }
};

export const move = (state: GameState, q: number, r: number, rng?: RandomSource): GameState => {
  if (!isPlaying(state)) return state;
  const preview = getMovePreview(state, q, r);
  if (!preview.valid) return log(state, preview.reason!);
  const species = state.species!;
  const map = new Map(state.map);
  let next = { ...state, map, riskVisits: { ...state.riskVisits }, metrics: { ...state.metrics }, player: { ...state.player } };
  let collisions = 0;
  let totalExposure = 0;
  for (const [index, point] of preview.path.entries()) {
    const cell = map.get(keyOf(point))!;
    revealAt(map, point);
    // Cumulative cost avoids tiny positive residuals on flights that use exactly all energy.
    let energy = state.player.energy - estimateMoveCost(state, index + 1) - collisions * ROAD_COLLISION_ENERGY_LOSS;
    let collision = false;
    if (cell.type === TerrainType.ROAD) {
      const visitKey = `${state.day}:${keyOf(point)}`;
      const visit = next.riskVisits[visitKey] ?? 0;
      const roll = rng ? rng() : randomUnit(state.config.seed, 'road', `${visitKey}:${visit}`);
      next.riskVisits[visitKey] = visit + 1;
      if (roll < ROAD_COLLISION_CHANCE) {
        energy -= ROAD_COLLISION_ENERGY_LOSS;
        collision = true;
        collisions++;
        next = log(next, `Vehicle collision while crossing road at (${point.q}, ${point.r}): lost ${ROAD_COLLISION_ENERGY_LOSS} energy.`);
      }
    }
    // Pesticide exposure is an arrival effect; road hazards apply to every traversed road.
    const isDestination = point.q === q && point.r === r;
    const exposure = isDestination ? cell.pesticideLevel * 15 * (1 - species.pesticideResilience) : 0;
    totalExposure += exposure;
    next = {
      ...next,
      metrics: { ...next.metrics, distance: next.metrics.distance + 1,
        energySpent: state.metrics.energySpent + estimateMoveCost(state, index + 1) + collisions * ROAD_COLLISION_ENERGY_LOSS,
        collisions: next.metrics.collisions + (collision ? 1 : 0),
        exposureEvents: next.metrics.exposureEvents + (exposure > 0 ? 1 : 0),
        toxicityAccumulated: next.metrics.toxicityAccumulated + exposure },
      player: { ...next.player, ...point, energy, toxicity: next.player.toxicity + exposure }
    };
    if (exposure > 0) next = log(next, `Pesticide exposure on arrival: +${exposure.toFixed(1)} toxicity.`);
    next = finishIfDead(next, collision ? 'Vehicle Collision' : 'Exhaustion');
    if (next.status === 'GAME_OVER') return next;
  }
  const waterNote = map.get(`${q},${r}`)?.type === TerrainType.WATER ? ' Water provides no food or detoxification.' : '';
  const collisionNote = collisions ? ` Warning: ${collisions} vehicle ${collisions === 1 ? 'collision' : 'collisions'} cost ${collisions * ROAD_COLLISION_ENERGY_LOSS} extra energy.` : '';
  const exposureNote = totalExposure > 0 ? ` Pesticide exposure: +${totalExposure.toFixed(1)} toxicity.` : '';
  return log(next, `Moved ${preview.distance} ${preview.distance === 1 ? 'hex' : 'hexes'} to (${q}, ${r}); flight cost ${preview.energyCost.toFixed(1)} energy.${collisionNote}${exposureNote}${waterNote}`);
};

export interface ForagePreview {
  harvest: number;
  creditedResources: number;
  foodEnergy: number;
  energyAfter: number;
  energyChange: number;
}

/** Feeding and its action cost resolve together, before any pesticide effects. */
export const getForagePreview = (state: GameState): ForagePreview | null => {
  const species = state.species, cell = state.map.get(keyOf(state.player));
  if (!isPlaying(state) || !species || !cell) return null;
  if ([TerrainType.NEST, TerrainType.ROAD, TerrainType.WATER].includes(cell.type) || cell.resourceQuality <= 0) return null;
  const impaired = state.player.toxicity > species.maxToxicity * 0.5;
  const harvest = Math.floor(cell.resourceQuality * species.forageEfficiency * WEATHER_EFFECTS[state.weather].resourceMult * 0.1 * (impaired ? 0.75 : 1) * (cell.type === TerrainType.CROP ? 1.5 : 1));
  const creditedResources = isHoverfly(state) && hasNearbyAphids(state)
    ? Math.floor(harvest * HOVERFLY_APHID_BONUS_MULTIPLIER) : harvest;
  const foodEnergy = harvest * ENERGY_PER_RESOURCE + (cell.type === TerrainType.CROP ? CROP_ENERGY_BONUS : 0);
  const energyAfter = clamp(state.player.energy + foodEnergy - species.energyCostForage, species.maxEnergy);
  return { harvest, creditedResources, foodEnergy, energyAfter, energyChange: energyAfter - state.player.energy };
};

export const getForageBlockReason = (state: GameState): string | null => {
  if (!isPlaying(state)) return 'Start a simulation to forage.';
  const cell = state.map.get(keyOf(state.player));
  if (!cell) return 'No foraging tile is selected.';
  if ([TerrainType.NEST, TerrainType.ROAD, TerrainType.WATER].includes(cell.type) || cell.resourceQuality <= 0) return 'There are no floral resources on this tile.';
  if (cell.lastForagedDay !== null && state.day - cell.lastForagedDay < RESOURCE_REGENERATION_DAYS) return `Resources depleted. Available again on day ${cell.lastForagedDay + RESOURCE_REGENERATION_DAYS}.`;
  if (getForagePreview(state)!.energyAfter <= 0) return 'This patch cannot provide enough energy to forage safely. Find a richer flower patch.';
  return null;
};
export const canForage = (state: GameState): boolean => getForageBlockReason(state) === null;

/** Aphids are potential larval prey; they are not food for the adult hoverfly. */
export const hasNearbyAphids = (state: GameState, position: HexCoordinate = state.player): boolean =>
  [...state.map.values()].some(cell => cell.aphids && hexDistance(position, cell) <= 1);

export const forage = (state: GameState): GameState => {
  if (!isPlaying(state)) return state;
  const reason = getForageBlockReason(state);
  if (reason) return log(state, reason);
  const species = state.species!, cellKey = keyOf(state.player), cell = state.map.get(cellKey)!;
  const impaired = state.player.toxicity > species.maxToxicity * 0.5;
  const preview = getForagePreview(state)!;
  const { harvest: amount, creditedResources: credited } = preview;
  const exposure = cell.pesticideLevel * 5 * (1 - species.pesticideResilience);
  const map = new Map(state.map);
  map.set(cellKey, { ...cell, lastForagedDay: state.day, hasForagedToday: true });
  const next = {
    ...state, map,
    metrics: { ...state.metrics, forageVisits: state.metrics.forageVisits + 1,
      energySpent: state.metrics.energySpent + species.energyCostForage,
      exposureEvents: state.metrics.exposureEvents + (exposure > 0 ? 1 : 0),
      toxicityAccumulated: state.metrics.toxicityAccumulated + exposure },
    player: { ...state.player,
      energy: preview.energyAfter,
      pollen: state.player.pollen + credited,
      toxicity: state.player.toxicity + exposure }
  };
  const resource = isHoverfly(state) ? `${amount} floral resource units` : `${amount * POLLEN_MG_PER_UNIT} mg pollen-equivalent`;
  const bonusNote = credited > amount ? ` Nearby aphids add ${credited - amount} reproductive resource units: prey for future larvae, not food for the adult.` : '';
  const energyNote = ` Energy ${preview.energyChange >= 0 ? '+' : ''}${preview.energyChange.toFixed(1)} after feeding and foraging costs (now ${preview.energyAfter.toFixed(1)}/${species.maxEnergy}).`;
  return finishIfDead(log(next, `Foraged ${resource}.${bonusNote}${energyNote}${impaired ? ' Yield reduced by toxicity.' : ''}${exposure > 0 ? ` Exposure: +${exposure.toFixed(1)} toxicity.` : ''}`));
};

export const isSafeShelter = (state: GameState): boolean => {
  const type = state.map.get(keyOf(state.player))?.type;
  return type === TerrainType.NEST || (isHoverfly(state) && (type === TerrainType.FOREST || type === TerrainType.URBAN));
};

export interface RestPreview { energyAfter: number; energyChange: number; sheltered: boolean }

/** Rest restores activity energy if the pollinator survives the night. */
export const getRestPreview = (state: GameState): RestPreview | null => {
  if (!isPlaying(state)) return null;
  const sheltered = isSafeShelter(state);
  const recovery = sheltered ? SHELTER_REST_RECOVERY : OPEN_REST_RECOVERY;
  const energyAfter = clamp(state.player.energy + recovery, state.species!.maxEnergy);
  return { energyAfter, energyChange: energyAfter - state.player.energy, sheltered };
};

export const endDay = (state: GameState, rng?: RandomSource): GameState => {
  if (!isPlaying(state)) return state;
  const { sheltered, energyAfter, energyChange } = getRestPreview(state)!;
  if (!sheltered && (rng ? rng() : randomUnit(state.config.seed, 'night', String(state.day))) < NIGHT_PREDATION_CHANCE) {
    return finishIfDead({ ...state, player: { ...state.player, energy: 0 } }, 'Predation during night');
  }
  let next = log({
    ...state, player: { ...state.player, energy: energyAfter },
    metrics: { ...state.metrics, completedDays: state.metrics.completedDays + 1 }
  }, `${sheltered ? 'Rested safely in shelter.' : 'Survived a rest in the open.'} Recovered ${energyChange.toFixed(1)} energy (now ${energyAfter.toFixed(1)}/${state.species!.maxEnergy}).`);
  if (state.day >= MAX_DAYS) return log({ ...next, status: 'GAME_OVER' }, 'Season complete. Review survival, gathered resources and reproductive output.');
  const day = state.day + 1;
  const map = new Map(state.map);
  for (const [key, cell] of map) if (cell.lastForagedDay !== null && day - cell.lastForagedDay >= RESOURCE_REGENERATION_DAYS) {
    map.set(key, { ...cell, lastForagedDay: null, hasForagedToday: false });
  }
  next = { ...next, day, map, weather: state.weatherSchedule[day - 1] ?? Weather.SUNNY };
  return log(next, `${next.weather.charAt(0) + next.weather.slice(1).toLowerCase()} weather. Plan your next foraging trip and rest before energy runs out.`);
};

/** Fictional game outputs informed by representative pollen requirements, not demographic predictions. */
export const getReproductiveScore = (state: GameState): { score: number; label: string } => {
  if (isHoverfly(state)) return { score: Math.floor(state.player.pollen / HOVERFLY_RESOURCES_PER_EGG), label: 'Eggs supported' };
  const pollenMg = state.player.pollen * POLLEN_MG_PER_UNIT;
  return state.species?.name === SpeciesType.SOLITARY_BEE
    ? { score: Math.floor(pollenMg / SOLITARY_POLLEN_PER_CELL_MG), label: 'Nest cells provisioned' }
    : { score: Math.floor(pollenMg / BUMBLEBEE_POLLEN_PER_WORKER_MG), label: 'Workers supported' };
};
