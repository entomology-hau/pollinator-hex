import assert from 'node:assert/strict';
import test from 'node:test';
import { SPECIES_DATA } from '../constants';
import { GameState, HexCell, SpeciesType, TerrainType, Weather } from '../types';
import {
  canForage, createInitialState, createMap, endDay, estimateMoveCost, forage,
  getForageBlockReason, getMovePreview, hexDistance, move, startGame, traceHexPath
} from '../game/rules';

const tile = (q: number, r: number, type = TerrainType.MEADOW, overrides: Partial<HexCell> = {}): HexCell => ({
  q, r, type, isRevealed: true, hasForagedToday: false,
  lastForagedDay: null, pesticideLevel: 0, resourceQuality: 80, ...overrides
});
const scenario = (cells: HexCell[], species = SpeciesType.BUMBLEBEE): GameState => ({
  ...createInitialState(), status: 'PLAYING', species: SPECIES_DATA[species],
  player: { ...createInitialState().player, energy: SPECIES_DATA[species].maxEnergy },
  map: new Map(cells.map(cell => [`${cell.q},${cell.r}`, cell]))
});
const safe = () => 0.5;

test('map generation is deterministic with injected random source and preserves the nest', () => {
  const first = createMap(() => 0.5);
  assert.deepEqual(first, createMap(() => 0.5));
  assert.equal(first.size, 127);
  assert.equal(first.get('0,0')?.type, TerrainType.NEST);
  assert.equal(first.get('0,0')?.isRevealed, true);
  assert.equal(startGame(SPECIES_DATA[SpeciesType.HOVERFLY], safe).player.energy, 100);
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
  assert.match(result.player.history.at(-1)!.event, /9 nectar/);
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
  const day2 = endDay(first, () => 0.1);
  const day3 = endDay(day2, () => 0.1);
  const day4 = endDay(day3, () => 0.1);
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

test('rest preserves nest and outdoor balance, caps energy and processes night mortality', () => {
  const nest = scenario([tile(0, 0, TerrainType.NEST)]);
  nest.player.energy = 130;
  assert.equal(endDay(nest, safe).player.energy, 150);
  const outside = scenario([tile(0, 0, TerrainType.NEST), tile(1, 0)]);
  outside.player.q = 1;
  outside.player.energy = 100;
  assert.equal(endDay(outside, safe).player.energy, 120);
  const death = endDay(outside, () => 0.99);
  assert.equal(death.status, 'GAME_OVER');
  assert.equal(death.player.deathReason, 'Predation during night');
  assert.equal(death.player.energy, 0);
});

test('season ends at day 15 and no transition can alter a finished run', () => {
  let state = scenario([tile(0, 0, TerrainType.NEST)]);
  for (let day = 1; day <= 15; day++) state = endDay(state, safe);
  assert.equal(state.day, 15);
  assert.equal(state.status, 'GAME_OVER');
  assert.equal(state.player.isAlive, true);
  assert.equal(state.player.pollen, 0);
  assert.equal(move(state, 1, 0, safe), state);
  assert.equal(forage(state), state);
  assert.equal(endDay(state, safe), state);
});
