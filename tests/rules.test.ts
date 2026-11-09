import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_DAYS, SPECIES_DATA, FLORAL_RESERVE_CAPACITY, OVIPOSITION_RESOURCE_COST, OVIPOSITION_ENERGY_COST, EGGS_PER_OVIPOSITION, MAX_EGGS_PER_DAY } from '../constants';
import { DEFAULT_CONFIG } from '../game/scenarios';
import { GameState, HexCell, SpeciesType, TerrainType, Weather } from '../types';
import {
  canForage, createInitialState, createMap, endDay, estimateMoveCost, forage,
  getForageBlockReason, getMovePreview, hexDistance, move, startGame, traceHexPath,
  getOvipositionBlockReason, getReproductiveScore, isSafeShelter, oviposit
} from '../game/rules';

const tile = (q: number, r: number, type = TerrainType.MEADOW, overrides: Partial<HexCell> = {}): HexCell => ({
  q, r, type, isRevealed: true, hasForagedToday: false,
  lastForagedDay: null, pesticideLevel: 0, resourceQuality: 80, aphids: false, flowerStrip: false, lastOvipositionDay: null, ...overrides
});
const scenario = (cells: HexCell[], species = SpeciesType.BUMBLEBEE): GameState => ({
  ...createInitialState(), status: 'PLAYING', species: SPECIES_DATA[species],
  weatherSchedule: Array(MAX_DAYS).fill(Weather.SUNNY),
  player: { ...createInitialState().player, energy: SPECIES_DATA[species].maxEnergy },
  map: new Map(cells.map(cell => [`${cell.q},${cell.r}`, cell]))
});
const safe = () => 0.5;

test('seeded map generation preserves the nest and initial species energy', () => {
  const first = createMap(DEFAULT_CONFIG);
  assert.deepEqual(first, createMap(DEFAULT_CONFIG));
  assert.equal(first.size, 127);
  assert.equal(first.get('0,0')?.type, TerrainType.NEST);
  assert.equal(first.get('0,0')?.isRevealed, true);
  assert.equal(startGame(SPECIES_DATA[SpeciesType.HOVERFLY], DEFAULT_CONFIG).player.energy, 100);
});

test('axial paths contain adjacent steps and produce the same route in reverse', () => {
  const start = { q: 0, r: 0 };
  for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) {
    const end = { q, r };
    const path = traceHexPath(start, end);
    assert.equal(path.length, hexDistance(start, end));
    if (!path.length) continue;
    assert.deepEqual(path.at(-1), end);
    [start, ...path].slice(1).forEach((point, index) => assert.equal(hexDistance([start, ...path][index], point), 1));
    assert.deepEqual([start, ...path], [end, ...traceHexPath(end, start)].reverse());
  }
});

test('road danger applies to intermediate tiles, consistently for direct and split travel', () => {
  const initial = scenario([tile(0, 0), tile(1, 0, TerrainType.ROAD), tile(2, 0)]);
  const preview = getMovePreview(initial, 2, 0);
  assert.equal(preview.valid, true);
  assert.equal(preview.roadCrossings, 1);
  assert.equal(preview.energyCost, 20);
  let draws = 0;
  const direct = move(initial, 2, 0, () => { draws++; return 0; });
  const split = move(move(initial, 1, 0, () => 0), 2, 0, () => 0);
  assert.equal(draws, 1);
  assert.equal(direct.player.energy, 95);
  assert.equal(direct.player.energy, split.player.energy);
  assert.equal(direct.player.q, 2);
  assert.match(direct.player.history.at(-1)!.event, /collision/);
  assert.equal(initial.player.energy, 150, 'transition must not mutate the original player');
});

test('each crossed road is checked, but leaving an origin road does not repeat its risk', () => {
  const initial = scenario([tile(0, 0, TerrainType.ROAD), tile(1, 0, TerrainType.ROAD), tile(2, 0, TerrainType.ROAD), tile(3, 0)]);
  let draws = 0;
  const result = move(initial, 3, 0, () => { draws++; return 0.9; });
  assert.equal(draws, 2);
  assert.equal(result.player.energy, 120);
});

test('lethal intermediate collision stops on the road and clamps energy to zero', () => {
  const initial = scenario([tile(0, 0), tile(1, 0, TerrainType.ROAD), tile(2, 0)]);
  initial.player.energy = 40;
  const result = move(initial, 2, 0, () => 0);
  assert.equal(result.status, 'GAME_OVER');
  assert.equal(result.player.q, 1);
  assert.equal(result.player.energy, 0);
  assert.equal(result.player.deathReason, 'Vehicle Collision');
  assert.equal(result.player.isAlive, false);
});

test('water cycling spends energy, provides no detoxification and cannot be foraged', () => {
  let state = scenario([tile(0, 0), tile(1, 0, TerrainType.WATER)], SpeciesType.HOVERFLY);
  state.player.energy = 90;
  state.player.toxicity = 10;
  for (let trip = 0; trip < 4; trip++) {
    state = move(state, 1, 0, safe);
    assert.equal(canForage(state), false);
    const attempted = forage(state);
    assert.equal(attempted.player.energy, state.player.energy);
    assert.equal(attempted.player.pollen, 0);
    assert.match(attempted.player.history.at(-1)!.event, /no floral resources/);
    state = move(state, 0, 0, safe);
  }
  assert.equal(state.player.energy, 58);
  assert.equal(state.player.toxicity, 10);
  assert.equal(state.day, 1);
});

test('invalid, zero-distance, missing-route, unaffordable and out-of-range moves leave position and resources intact', () => {
  const initial = scenario([tile(0, 0), tile(1, 0), tile(2, 0), tile(4, 0)]);
  initial.player.energy = 15;
  for (const [q, r] of [[0, 0], [2, 0], [4, 0], [99, 99], [0.5, 0], [NaN, 0]]) {
    assert.equal(getMovePreview(initial, q, r).valid, false);
    const result = move(initial, q, r, () => { throw new Error('invalid move must not draw randomness'); });
    assert.equal(result.player.q, 0);
    assert.equal(result.player.r, 0);
    assert.equal(result.player.energy, 15);
    assert.equal(result.map, initial.map);
    assert.equal(result.player.history.length, 1);
  }
  const hole = scenario([tile(0, 0), tile(2, 0)]);
  assert.match(getMovePreview(hole, 2, 0).reason!, /no route/);
});

test('preview energy cost matches weather and impairment and exact exhaustion ends the run', () => {
  const initial = scenario([tile(0, 0), tile(1, 0)]);
  initial.weather = Weather.RAINY;
  initial.player.toxicity = 51;
  initial.player.energy = 30;
  assert.equal(estimateMoveCost(initial, 1), 30);
  assert.equal(getMovePreview(initial, 1, 0).energyCost, 30);
  const result = move(initial, 1, 0, safe);
  assert.equal(result.status, 'GAME_OVER');
  assert.equal(result.player.energy, 0);
  assert.equal(result.player.deathReason, 'Starvation');
  const fractional = scenario([tile(0, 0), tile(1, 0), tile(2, 0), tile(3, 0)], SpeciesType.HOVERFLY);
  fractional.weather = Weather.CLOUDY;
  fractional.player.energy = getMovePreview(fractional, 3, 0).energyCost;
  assert.equal(move(fractional, 3, 0, safe).player.energy, 0);
  assert.equal(move(fractional, 3, 0, safe).status, 'GAME_OVER');
});

test('hoverfly crop feeding awards floral resources only and no aphid predation bonus', () => {
  const initial = scenario([tile(0, 0, TerrainType.CROP)], SpeciesType.HOVERFLY);
  const result = forage(initial);
  assert.equal(result.player.pollen, 9); // floor(80 × 0.8 × 0.1 × 1.5)
  assert.equal(result.player.energy, 100);
  assert.match(result.player.history.at(-1)!.event, /9 floral resource/);
  assert.doesNotMatch(result.player.history.at(-1)!.event, /aphids eaten|bio-control bonus/i);
  assert.equal(initial.map.get('0,0')!.lastForagedDay, null);
});

test('depleted floral resources remain unavailable until three days have elapsed', () => {
  const initial = scenario([tile(0, 0)]);
  const first = forage(initial);
  assert.equal(first.player.pollen, 12);
  assert.equal(canForage(first), false);
  assert.match(getForageBlockReason(first)!, /day 4/);
  const repeat = forage(first);
  assert.equal(repeat.player.pollen, first.player.pollen);
  assert.equal(repeat.player.energy, first.player.energy);
  const day2 = endDay(first, safe);
  const day3 = endDay(day2, safe);
  const day4 = endDay(day3, safe);
  assert.equal(canForage(day2), false);
  assert.equal(canForage(day3), false);
  assert.equal(canForage(day4), true);
  assert.equal(forage(day4).player.pollen, 24);
  assert.equal(first.map.get('0,0')!.lastForagedDay, 1);
});

test('foraging obeys energy and terrain restrictions in the engine, not just the interface', () => {
  for (const type of [TerrainType.NEST, TerrainType.ROAD, TerrainType.WATER]) {
    const initial = scenario([tile(0, 0, type)]);
    assert.equal(canForage(initial), false);
    assert.equal(forage(initial).player.pollen, 0);
  }
  const tired = scenario([tile(0, 0)]);
  tired.player.energy = 4;
  assert.match(getForageBlockReason(tired)!, /exhausted/);
  assert.equal(forage(tired).player.energy, 4);
});

test('foraging and movement toxicity deaths clamp to species threshold', () => {
  const initial = scenario([tile(0, 0, TerrainType.CROP, { pesticideLevel: 1 }), tile(1, 0, TerrainType.CROP, { pesticideLevel: 1 })], SpeciesType.HOVERFLY);
  initial.player.toxicity = 29.9;
  for (const result of [forage(initial), move(initial, 1, 0, safe)]) {
    assert.equal(result.status, 'GAME_OVER');
    assert.equal(result.player.toxicity, 30);
    assert.equal(result.player.deathReason, 'Pesticide Accumulation');
    assert.equal(result.player.isAlive, false);
  }
});

test('end of day charges maintenance in every habitat and processes night mortality', () => {
  const nest = scenario([tile(0, 0, TerrainType.NEST)]);
  nest.player.energy = 130;
  assert.equal(endDay(nest, safe).player.energy, 130 - SPECIES_DATA[SpeciesType.BUMBLEBEE].dailyMaintenance);
  const outside = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0)]);
  outside.player.q = 1;
  outside.player.energy = 100;
  assert.equal(endDay(outside, safe).player.energy, 100 - SPECIES_DATA[SpeciesType.BUMBLEBEE].dailyMaintenance);
  const death = endDay(outside, () => 0.01);
  assert.equal(death.status, 'GAME_OVER');
  assert.equal(death.player.deathReason, 'Predation during night');
  assert.equal(death.player.energy, 0);
});

test('all idle pollinators starve before completing the season, including at shelter', () => {
  for (const species of Object.values(SpeciesType)) {
    let state = scenario([tile(0, 0, TerrainType.NEST)], species);
    for (let day = 1; day <= MAX_DAYS; day++) state = endDay(state, safe);
    assert.equal(state.status, 'GAME_OVER');
    assert.equal(state.player.isAlive, false);
    assert.equal(state.player.deathReason, 'Starvation');
    assert.ok(state.metrics.completedDays < MAX_DAYS);
    assert.equal(getReproductiveScore(state).score, 0);
    assert.equal(move(state, 1, 0, safe), state);
    assert.equal(forage(state), state);
    assert.equal(endDay(state, safe), state);
    assert.equal(oviposit(state), state);
  }
});

test('a fed survivor pays final-day maintenance before completing day 15', () => {
  const state = scenario([tile(0, 0, TerrainType.NEST)]);
  state.day = MAX_DAYS;
  state.metrics.completedDays = MAX_DAYS - 1;
  state.player.energy = 20;
  const result = endDay(state, safe);
  assert.equal(result.status, 'GAME_OVER');
  assert.equal(result.player.isAlive, true);
  assert.equal(result.metrics.completedDays, MAX_DAYS);
  assert.equal(result.player.energy, 20 - state.species!.dailyMaintenance);
});

test('bees must safely arrive at the nest to convert carried resources into provisioning', () => {
  let state = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0)]);
  state = forage(move(state, 1, 0, safe));
  assert.equal(state.player.carriedPollen, 12);
  assert.equal(state.player.deliveredPollen, 0);
  assert.equal(getReproductiveScore(state).score, 0);
  const delivered = move(state, 0, 0, safe);
  assert.equal(delivered.player.carriedPollen, 0);
  assert.equal(delivered.player.deliveredPollen, 12);
  assert.equal(getReproductiveScore(delivered).score, 0, 'a partial pollen provision does not yet support a whole worker');
  assert.equal(state.player.carriedPollen, 12, 'delivery does not mutate prior state');
});

test('pollen carried at an earlier death or exact-energy arrival is never delivered', () => {
  const state = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0, TerrainType.ROAD), tile(2, 0)]);
  state.player.q = 2;
  state.player.carriedPollen = 20;
  state.player.energy = 40;
  const collision = move(state, 0, 0, () => 0);
  assert.equal(collision.status, 'GAME_OVER');
  assert.equal(collision.player.q, 1);
  assert.equal(collision.player.deliveredPollen, 0);
  assert.equal(getReproductiveScore(collision).score, 0);
  const exhausted = { ...state, map: new Map([['0,0', tile(0, 0, TerrainType.NEST)], ['1,0', tile(1, 0)]]), player: { ...state.player, q: 1, energy: 10 } };
  const arrival = move(exhausted, 0, 0, safe);
  assert.equal(arrival.status, 'GAME_OVER');
  assert.equal(arrival.player.deliveredPollen, 0);
});

test('carrying capacity limits retained pollen, while feeding can still restore energy', () => {
  const state = scenario([tile(0, 0)]);
  state.player.carriedPollen = state.species!.carryingCapacity - 2;
  state.player.energy = 50;
  const result = forage(state);
  assert.equal(result.player.carriedPollen, state.species!.carryingCapacity);
  assert.equal(result.player.pollen, 12);
  assert.equal(result.player.energy, 50 - state.species!.energyCostForage + 12 * 4);
  assert.match(result.player.history.at(-1)!.event, /excess resources/);
});

test('hoverfly feeding accumulates a bounded reserve but no reproductive output', () => {
  const state = scenario([tile(0, 0)], SpeciesType.HOVERFLY);
  state.player.floralReserve = FLORAL_RESERVE_CAPACITY - 1;
  const fed = forage(state);
  assert.equal(fed.player.floralReserve, FLORAL_RESERVE_CAPACITY);
  assert.equal(fed.player.carriedPollen, 0);
  assert.equal(fed.player.ovipositionBatches, 0);
  assert.equal(getReproductiveScore(fed).score, 0);
});

test('oviposition requires the hoverfly, suitable aphid habitat, reserve and energy', () => {
  const aphids = tile(0, 0, TerrainType.CROP, { aphids: true, resourceQuality: 0 });
  const bee = scenario([aphids]);
  assert.match(getOvipositionBlockReason(bee)!, /Only the hoverfly/);
  const empty = scenario([tile(0, 0)], SpeciesType.HOVERFLY);
  assert.match(getOvipositionBlockReason(empty)!, /aphid-bearing/);
  const hungry = scenario([aphids], SpeciesType.HOVERFLY);
  assert.match(getOvipositionBlockReason(hungry)!, /Feed on flowers/);
  const tired = { ...hungry, player: { ...hungry.player, floralReserve: OVIPOSITION_RESOURCE_COST, energy: OVIPOSITION_ENERGY_COST - 1 } };
  assert.match(getOvipositionBlockReason(tired)!, /energy/);
  for (const state of [bee, empty, hungry, tired]) {
    const result = oviposit(state);
    assert.equal(result.player.ovipositionBatches, 0);
    assert.equal(result.player.energy, state.player.energy);
    assert.deepEqual(result.metrics, state.metrics);
  }
  assert.equal(canForage(hungry), false, 'a non-flowering aphid patch is not food');
});

test('oviposition consumes adult reserve once per patch each day, separately from feeding', () => {
  const state = scenario([tile(0, 0, TerrainType.CROP, { aphids: true, resourceQuality: 0 })], SpeciesType.HOVERFLY);
  state.player.floralReserve = 20;
  const laid = oviposit(state);
  assert.equal(laid.player.floralReserve, 20 - OVIPOSITION_RESOURCE_COST);
  assert.equal(laid.player.energy, 100 - OVIPOSITION_ENERGY_COST);
  assert.equal(laid.player.ovipositionBatches, 1);
  assert.ok(getReproductiveScore(laid).score > 0);
  assert.match(getOvipositionBlockReason(laid)!, /already been used/);
  assert.equal(oviposit(laid).player.ovipositionBatches, 1);
  const nextDay = endDay(laid, safe);
  assert.equal(getOvipositionBlockReason(nextDay), null);
  assert.equal(oviposit(nextDay).player.ovipositionBatches, 2);
  assert.equal(state.map.get('0,0')!.lastOvipositionDay, null);
});

test('hoverflies can shelter away from the central nest; bees cannot', () => {
  for (const terrain of [TerrainType.FOREST, TerrainType.URBAN]) {
    const hoverfly = scenario([tile(1, 0, terrain)], SpeciesType.HOVERFLY);
    hoverfly.player.q = 1;
    assert.equal(isSafeShelter(hoverfly), true);
    assert.equal(endDay(hoverfly, () => 0).player.isAlive, true);
    const bee = scenario([tile(1, 0, terrain)]);
    bee.player.q = 1;
    assert.equal(isSafeShelter(bee), false);
    assert.equal(endDay(bee, () => 0).player.deathReason, 'Predation during night');
  }
});

test('metrics reflect actual distance before death, cumulative exposure and action costs', () => {
  const state = scenario([tile(0, 0), tile(1, 0, TerrainType.ROAD), tile(2, 0)]);
  state.player.energy = 40;
  const dead = move(state, 2, 0, () => 0);
  assert.equal(dead.metrics.distance, 1);
  assert.equal(dead.metrics.collisions, 1);
  assert.equal(dead.metrics.energySpent, 45);
  assert.equal(dead.metrics.completedDays, 0);
  let exposed = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0, TerrainType.CROP, { pesticideLevel: 1 })]);
  exposed = forage(move(exposed, 1, 0, safe));
  assert.equal(exposed.metrics.forageVisits, 1);
  assert.equal(exposed.metrics.exposureEvents, 2);
  assert.equal(exposed.metrics.toxicityAccumulated, 12);
  assert.equal(exposed.metrics.energySpent, 15);
});

test('same seed, pollinator and actions replay identically without global randomness', () => {
  const replay = () => {
    let state = startGame(SPECIES_DATA[SpeciesType.BUMBLEBEE], { ...DEFAULT_CONFIG, seed: 'replay-test' });
    state = move(state, 0, -1);
    state = forage(state);
    state = move(state, 0, 0);
    state = endDay(state);
    state = move(state, 1, 0);
    state = endDay(state);
    return state;
  };
  assert.deepEqual(replay(), replay());
});

test('road draws are local to day and cell, and invalid actions cannot change later hazards', () => {
  const initial = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0, TerrainType.ROAD), tile(2, 0)]);
  const invalid = move(initial, 99, 99);
  assert.deepEqual(invalid.riskVisits, initial.riskVisits);
  const direct = move(initial, 2, 0);
  const afterInvalid = move(invalid, 2, 0);
  assert.equal(direct.player.energy, afterInvalid.player.energy);
  assert.deepEqual(direct.riskVisits, afterInvalid.riskVisits);
  assert.equal(direct.riskVisits['1:1,0'], 1);
  assert.deepEqual(initial.riskVisits, {});
});

test('weather schedule is independent of actions, species and treatment', () => {
  const config = { ...DEFAULT_CONFIG, seed: 'shared-weather', scenarioId: 'pesticide' as const };
  const bee = startGame(SPECIES_DATA[SpeciesType.BUMBLEBEE], config);
  const hoverfly = startGame(SPECIES_DATA[SpeciesType.HOVERFLY], { ...config, treatment: 'intervention' });
  assert.deepEqual(bee.weatherSchedule, hoverfly.weatherSchedule);
  let active = forage(move(bee, 0, -1, safe));
  active = move(active, 0, 0, safe);
  active = endDay(active, safe);
  assert.equal(active.weather, endDay(bee, safe).weather);
  assert.equal(active.weather, bee.weatherSchedule[1]);
});


test('reproductive outputs use representative pollen requirements and real egg counts', () => {
  const bumblebee = scenario([tile(0, 0, TerrainType.NEST)]);
  bumblebee.player.deliveredPollen = 119;
  assert.deepEqual(getReproductiveScore(bumblebee), { score: 1, label: 'Workers supported' });
  bumblebee.player.deliveredPollen = 120;
  assert.equal(getReproductiveScore(bumblebee).score, 2);
  const solitary = scenario([tile(0, 0, TerrainType.NEST)], SpeciesType.SOLITARY_BEE);
  solitary.player.deliveredPollen = 129;
  assert.deepEqual(getReproductiveScore(solitary), { score: 1, label: 'Nest cells provisioned' });
  solitary.player.deliveredPollen = 130;
  assert.equal(getReproductiveScore(solitary).score, 2);
  const fly = scenario([tile(0, 0)], SpeciesType.HOVERFLY);
  fly.player.ovipositionBatches = 3;
  assert.deepEqual(getReproductiveScore(fly), { score: 30, label: 'Eggs laid' });
});

test('daily egg cap applies across patches and resets only when a new day begins', () => {
  const state = scenario([tile(0, 0, TerrainType.CROP, { aphids: true, resourceQuality: 0 })], SpeciesType.HOVERFLY);
  state.player.floralReserve = 20;
  state.player.eggsLaidToday = MAX_EGGS_PER_DAY - EGGS_PER_OVIPOSITION;
  const laid = oviposit(state);
  assert.equal(laid.player.eggsLaidToday, MAX_EGGS_PER_DAY);
  const otherPatch = { ...laid, map: new Map([['0,0', tile(0, 0, TerrainType.CROP, { aphids: true })]]) };
  assert.match(getOvipositionBlockReason(otherPatch)!, /Daily egg-laying limit/);
  assert.equal(oviposit(otherPatch).player.ovipositionBatches, 1);
  const tomorrow = endDay(laid, safe);
  assert.equal(tomorrow.player.eggsLaidToday, 0);
  assert.equal(getOvipositionBlockReason(tomorrow), null);
});
