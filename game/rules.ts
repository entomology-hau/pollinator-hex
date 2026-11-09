import { MAP_RADIUS, MAX_DAYS, RESOURCE_REGEN_DAYS, START_ENERGY, WEATHER_EFFECTS } from '../constants';
import { GameState, HexCell, SpeciesStats, SpeciesType, TerrainType, Weather } from '../types';

export type RandomSource = () => number;
export interface HexCoordinate { q: number; r: number }
export interface MovePreview {
  valid: boolean;
  reason: string | null;
  distance: number;
  energyCost: number;
  /** Actual crossed road cells. Interfaces must not disclose unrevealed terrain. */
  roadCrossings: number;
  /** The straight route, excluding the origin and including the destination. */
  path: HexCoordinate[];
}

export const RESOURCE_REGENERATION_DAYS = RESOURCE_REGEN_DAYS;
export const ROAD_COLLISION_CHANCE = 0.25;
export const ROAD_COLLISION_ENERGY_LOSS = 35;

const keyOf = ({ q, r }: HexCoordinate) => `${q},${r}`;
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(value, maximum));

export const hexDistance = (from: HexCoordinate, to: HexCoordinate): number =>
  (Math.abs(from.q - to.q) + Math.abs(from.r - to.r) + Math.abs(from.q + from.r - to.q - to.r)) / 2;

const roundHex = (q: number, r: number): HexCoordinate => {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq === 0 ? 0 : rq, r: rr === 0 ? 0 : rr };
};

/** Stable line rounding uses the same small offset at both ends of a route. */
export const traceHexPath = (from: HexCoordinate, to: HexCoordinate): HexCoordinate[] => {
  const distance = hexDistance(from, to);
  if (!Number.isInteger(distance) || distance === 0) return [];
  return Array.from({ length: distance }, (_, index) => {
    const t = (index + 1) / distance;
    return roundHex(from.q + (to.q - from.q) * t + 1e-6, from.r + (to.r - from.r) * t + 1e-6);
  });
};

export const createMap = (rng: RandomSource = Math.random): Map<string, HexCell> => {
  const map = new Map<string, HexCell>();
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    for (let r = Math.max(-MAP_RADIUS, -q - MAP_RADIUS); r <= Math.min(MAP_RADIUS, -q + MAP_RADIUS); r++) {
      const roll = rng();
      let type = TerrainType.MEADOW;
      if (q === 0 && r === 0) type = TerrainType.NEST;
      else if (roll > 0.95) type = TerrainType.WATER;
      else if (roll > 0.8) type = TerrainType.FOREST;
      else if (roll > 0.65) type = TerrainType.URBAN;
      else if (roll > 0.45) type = TerrainType.CROP;
      map.set(`${q},${r}`, {
        q, r, type, isRevealed: q === 0 && r === 0,
        hasForagedToday: false, lastForagedDay: null, pesticideLevel: 0,
        resourceQuality: Math.floor(rng() * 50) + 50
      });
    }
  }
  for (let road = 0; road < 2; road++) {
    const angle = rng() * Math.PI * 2;
    const start = roundHex(Math.cos(angle) * MAP_RADIUS, Math.sin(angle) * MAP_RADIUS);
    const end = { q: -start.q, r: -start.r };
    for (const point of [start, ...traceHexPath(start, end)]) {
      const key = keyOf(point);
      const cell = map.get(key);
      if (cell && cell.type !== TerrainType.NEST) map.set(key, { ...cell, type: TerrainType.ROAD });
    }
  }
  for (const [key, cell] of map) {
    let pesticideLevel = 0;
    if (cell.type === TerrainType.CROP) pesticideLevel = rng() * 0.8 + 0.2;
    if (cell.type === TerrainType.URBAN) pesticideLevel = rng() * 0.4;
    map.set(key, { ...cell, pesticideLevel });
  }
  return map;
};

export const createInitialState = (): GameState => ({
  status: 'MENU', day: 1, weather: Weather.SUNNY, species: null,
  player: { energy: START_ENERGY, pollen: 0, toxicity: 0, q: 0, r: 0, isAlive: true, history: [] },
  map: new Map()
});

export const startGame = (species: SpeciesStats, rng: RandomSource = Math.random): GameState => ({
  ...createInitialState(), status: 'PLAYING', species,
  player: {
    energy: species.maxEnergy, pollen: 0, toxicity: 0, q: 0, r: 0, isAlive: true,
    history: [{ day: 1, event: 'Season begins. Weather is sunny. Explore a nearby tile to find floral resources.' }]
  },
  map: createMap(rng)
});

const log = (state: GameState, event: string): GameState => ({
  ...state,
  player: { ...state.player, history: [...state.player.history, { day: state.day, event }] }
});

const isPlaying = (state: GameState): boolean => state.status === 'PLAYING' && state.player.isAlive && !!state.species;

const finishIfDead = (state: GameState, energyReason = 'Starvation'): GameState => {
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
  return {
    valid: reason === null, reason, distance, energyCost, path,
    roadCrossings: path.filter(point => state.map.get(keyOf(point))?.type === TerrainType.ROAD).length
  };
};

const revealAt = (map: Map<string, HexCell>, { q, r }: HexCoordinate) => {
  const neighbours = [{ q, r }, { q: q + 1, r }, { q: q - 1, r }, { q, r: r + 1 }, { q, r: r - 1 }, { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 }];
  for (const point of neighbours) {
    const key = keyOf(point);
    const cell = map.get(key);
    if (cell && !cell.isRevealed) map.set(key, { ...cell, isRevealed: true });
  }
};

export const move = (state: GameState, q: number, r: number, rng: RandomSource = Math.random): GameState => {
  if (!isPlaying(state)) return state;
  const preview = getMovePreview(state, q, r);
  if (!preview.valid) return log(state, preview.reason!);
  const species = state.species!;
  const map = new Map(state.map);
  let next = { ...state, map, player: { ...state.player } };
  let collisions = 0;
  let totalExposure = 0;
  for (const [index, point] of preview.path.entries()) {
    const cell = map.get(keyOf(point))!;
    revealAt(map, point);
    // Cumulative cost avoids rounding drift that could leave a zero-energy flight alive.
    let energy = state.player.energy - estimateMoveCost(state, index + 1) - collisions * ROAD_COLLISION_ENERGY_LOSS;
    let collision = false;
    if (cell.type === TerrainType.ROAD && rng() < ROAD_COLLISION_CHANCE) {
      energy -= ROAD_COLLISION_ENERGY_LOSS;
      collision = true;
      collisions++;
      next = log(next, `Vehicle collision while crossing road at (${point.q}, ${point.r}): lost ${ROAD_COLLISION_ENERGY_LOSS} energy.`);
    }
    // Exposure remains an arrival effect; road collisions apply to every traversed road cell.
    const isDestination = point.q === q && point.r === r;
    const exposure = isDestination ? cell.pesticideLevel * 15 * (1 - species.pesticideResilience) : 0;
    totalExposure += exposure;
    next = { ...next, player: { ...next.player, ...point, energy, toxicity: next.player.toxicity + exposure } };
    if (exposure > 0) next = log(next, `Pesticide exposure on arrival: +${exposure.toFixed(1)} toxicity.`);
    next = finishIfDead(next, collision ? 'Vehicle Collision' : 'Starvation');
    if (next.status === 'GAME_OVER') return next;
  }
  const waterNote = map.get(`${q},${r}`)?.type === TerrainType.WATER ? ' Water provides no food or detoxification in this model.' : '';
  const collisionNote = collisions ? ` Warning: ${collisions} vehicle ${collisions === 1 ? 'collision' : 'collisions'} cost ${collisions * ROAD_COLLISION_ENERGY_LOSS} extra energy.` : '';
  const exposureNote = totalExposure > 0 ? ` Pesticide exposure: +${totalExposure.toFixed(1)} toxicity.` : '';
  return log(next, `Moved ${preview.distance} ${preview.distance === 1 ? 'hex' : 'hexes'} to (${q}, ${r}); flight cost ${preview.energyCost.toFixed(1)} energy.${collisionNote}${exposureNote}${waterNote}`);
};

export const getForageBlockReason = (state: GameState): string | null => {
  if (!isPlaying(state)) return 'Start a simulation to forage.';
  const cell = state.map.get(keyOf(state.player));
  if (!cell) return 'No foraging tile is selected.';
  if ([TerrainType.NEST, TerrainType.ROAD, TerrainType.WATER].includes(cell.type)) return 'There are no floral resources on this tile.';
  if (cell.lastForagedDay !== null && state.day - cell.lastForagedDay < RESOURCE_REGENERATION_DAYS) {
    return `Resources depleted. Available again on day ${cell.lastForagedDay + RESOURCE_REGENERATION_DAYS}.`;
  }
  if (state.player.energy < state.species!.energyCostForage) return `Too exhausted to forage: you need ${state.species!.energyCostForage} energy.`;
  return null;
};

export const canForage = (state: GameState): boolean => getForageBlockReason(state) === null;

export const forage = (state: GameState): GameState => {
  if (!isPlaying(state)) return state;
  const reason = getForageBlockReason(state);
  if (reason) return log(state, reason);
  const species = state.species!;
  const cellKey = keyOf(state.player);
  const cell = state.map.get(cellKey)!;
  const impaired = state.player.toxicity > species.maxToxicity * 0.5;
  const crop = cell.type === TerrainType.CROP;
  const amount = Math.floor(cell.resourceQuality * species.forageEfficiency * WEATHER_EFFECTS[state.weather].resourceMult * 0.1 * (impaired ? 0.75 : 1) * (crop ? 1.5 : 1));
  const exposure = cell.pesticideLevel * 5 * (1 - species.pesticideResilience);
  const map = new Map(state.map);
  map.set(cellKey, { ...cell, lastForagedDay: state.day, hasForagedToday: true });
  let next = {
    ...state, map,
    player: {
      ...state.player,
      energy: state.player.energy - species.energyCostForage + amount * 0.5 + (crop ? 5 : 0),
      pollen: state.player.pollen + amount,
      toxicity: state.player.toxicity + exposure
    }
  };
  const resource = species.name === SpeciesType.HOVERFLY ? 'nectar' : 'pollen';
  next = log(next, `Collected ${amount} ${resource} units.${crop ? ' Flowering crop yield bonus.' : ''}${impaired ? ' Foraging efficiency reduced by toxicity.' : ''}${exposure > 0 ? ` Pesticide exposure: +${exposure.toFixed(1)} toxicity.` : ''}`);
  return finishIfDead(next);
};

const randomWeather = (rng: RandomSource): Weather => {
  const roll = rng();
  return roll > 0.7 ? Weather.RAINY : roll > 0.4 ? Weather.CLOUDY : Weather.SUNNY;
};

export const endDay = (state: GameState, rng: RandomSource = Math.random): GameState => {
  if (!isPlaying(state)) return state;
  const atNest = state.player.q === 0 && state.player.r === 0;
  if (!atNest && rng() > 0.85) {
    return finishIfDead({ ...state, player: { ...state.player, energy: 0 } }, 'Predation during night');
  }
  let next = log({
    ...state,
    player: { ...state.player, energy: clamp(state.player.energy + (atNest ? 40 : 20), state.species!.maxEnergy) }
  }, atNest ? 'Night falls. Rested safely at the nest/shelter (+40 energy, up to capacity).' : 'Night falls. Rested in the open (+20 energy, up to capacity).');
  if (state.day >= MAX_DAYS) return log({ ...next, status: 'GAME_OVER' }, 'Season complete. Compare survival and resource score separately.');
  const day = state.day + 1;
  const map = new Map(state.map);
  for (const [key, cell] of map) {
    if (cell.lastForagedDay !== null && day - cell.lastForagedDay >= RESOURCE_REGENERATION_DAYS) {
      map.set(key, { ...cell, lastForagedDay: null, hasForagedToday: false });
    }
  }
  next = { ...next, day, map, weather: randomWeather(rng) };
  return log(next, `Day ${day}: ${next.weather.toLowerCase()} weather.`);
};
