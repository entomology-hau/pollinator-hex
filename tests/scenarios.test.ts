import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_RADIUS, MAX_DAYS, SPECIES_DATA } from '../constants';
import { GameState, HexCell, RunConfig, ScenarioId, SpeciesType, TerrainType, Weather } from '../types';
import { randomUnit } from '../game/random';
import { APHID_PATCHES, createScenario, DEFAULT_CONFIG, FAR_APHID_FLOWERS, FLOWER_CORRIDOR, NEAR_APHID_FLOWERS, normaliseConfig, SCENARIOS } from '../game/scenarios';
import { createInitialState, getForagePreview } from '../game/rules';

const config = (scenarioId: ScenarioId, treatment: RunConfig['treatment'] = 'control', seed = 'teaching-seed'): RunConfig => ({ scenarioId, treatment, seed, trial: 1 });
const contents = (map: Map<string, HexCell>) => Array.from(map.entries());
const without = (cell: HexCell, keys: (keyof HexCell)[]) => Object.fromEntries(Object.entries(cell).filter(([key]) => !keys.includes(key as keyof HexCell)));
const dist = (from: readonly number[], to: readonly number[]) => (Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]) + Math.abs(from[0] + from[1] - to[0] - to[1])) / 2;
const previewState = (map: Map<string, HexCell>, species: SpeciesType, weather: Weather, impaired: boolean): GameState => {
  const initial = createInitialState();
  return {
    ...initial, status: 'PLAYING', map, species: SPECIES_DATA[species], weather,
    player: { ...initial.player, energy: 40, toxicity: impaired ? SPECIES_DATA[species].maxToxicity * 0.6 : 0 }
  };
};
const foodSupply = (map: Map<string, HexCell>, species: SpeciesType, weather: Weather, impaired: boolean) => {
  const state = previewState(map, species, weather, impaired);
  let harvest = 0;
  let foodEnergy = 0;
  for (const { q, r } of map.values()) {
    const preview = getForagePreview({ ...state, player: { ...state.player, q, r } });
    // Aphid habitat credit affects reproduction, so deliberately exclude it from adult food.
    harvest += preview?.harvest ?? 0;
    foodEnergy += preview?.foodEnergy ?? 0;
  }
  return { harvest, foodEnergy };
};

test('keyed random draws are stable, bounded, independent and unambiguous', () => {
  const before = randomUnit('a', 'weather', 4);
  for (let index = 0; index < 1000; index++) {
    const value = randomUnit('a', 'road', index);
    assert(value >= 0 && value < 1);
  }
  assert.equal(randomUnit('a', 'weather', 4), before);
  assert.notEqual(randomUnit('a', 'weather', 4), randomUnit('a', 'night', 4));
  assert.notEqual(randomUnit('a', 'weather', 4), randomUnit('b', 'weather', 4));
  assert.notEqual(randomUnit('a|b', 'c', 'd'), randomUnit('a', 'b|c', 'd'));
});

test('configuration is normalised without allowing trial labels to become random seeds', () => {
  assert.deepEqual(normaliseConfig(), DEFAULT_CONFIG);
  assert.equal(normaliseConfig({ seed: '  a seed  ' }).seed, 'a seed');
  assert.equal(normaliseConfig({ seed: 'x'.repeat(100) }).seed.length, 64);
  assert.equal(normaliseConfig({ seed: '   ' }).seed, DEFAULT_CONFIG.seed);
  assert.equal(normaliseConfig({ trial: -3 }).trial, 1);
  assert.equal(normaliseConfig({ trial: 2.9 }).trial, 2);
  assert.equal(normaliseConfig({ trial: NaN }).trial, 1);
  assert.equal(normaliseConfig({ trial: 1e20 }).trial, 999999);
  assert.equal(normaliseConfig({ scenarioId: 'toString' as ScenarioId }).scenarioId, DEFAULT_CONFIG.scenarioId);
  assert.equal(normaliseConfig({ treatment: 'bad' as RunConfig['treatment'] }).treatment, 'control');
});

test('a seed reproduces the complete initial environment regardless of trial label', () => {
  for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
    const first = createScenario(config(scenarioId));
    const repeat = createScenario({ ...config(scenarioId), trial: 42 });
    assert.deepEqual(contents(first.map), contents(repeat.map));
    assert.deepEqual(first.weatherSchedule, repeat.weatherSchedule);
    first.map.get('0,-1')!.resourceQuality = -10;
    assert.equal(createScenario(config(scenarioId)).map.get('0,-1')!.resourceQuality, 80, 'environments must not share mutable cells');
  }
});

test('different seeds change background landscapes while weather is common across paired conditions', () => {
  assert.notDeepEqual(contents(createScenario(config('pesticide', 'control', 'seed-a')).map), contents(createScenario(config('pesticide', 'control', 'seed-b')).map));
  const schedule = createScenario(config('flower-strips')).weatherSchedule;
  assert.equal(schedule.length, MAX_DAYS);
  assert.equal(schedule[0], Weather.SUNNY);
  assert(schedule.every(value => Object.values(Weather).includes(value)));
  for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
    for (const treatment of ['control', 'intervention'] as const) {
      assert.deepEqual(createScenario(config(scenarioId, treatment)).weatherSchedule, schedule);
    }
  }
});

test('flower strip pairs change only the five designated floral supplies', () => {
  for (const seed of ['one', 'two', 'three']) {
    const control = createScenario(config('flower-strips', 'control', seed)).map;
    const intervention = createScenario(config('flower-strips', 'intervention', seed)).map;
    const expected = new Set(FLOWER_CORRIDOR.map(([q, r]) => `${q},${r}`));
    const changed: string[] = [];
    for (const [key, before] of control) {
      const after = intervention.get(key)!;
      assert.deepEqual(without(before, ['resourceQuality', 'flowerStrip']), without(after, ['resourceQuality', 'flowerStrip']));
      if (expected.has(key)) {
        assert(before.resourceQuality >= 35 && before.resourceQuality <= 54);
        assert.equal(before.flowerStrip, false);
        assert.equal(after.resourceQuality, before.resourceQuality + 40);
        assert.equal(after.flowerStrip, true);
        changed.push(key);
      } else assert.deepEqual(after, before);
    }
    assert.equal(changed.length, 5);
    assert.equal(control.get('-6,0')!.resourceQuality, intervention.get('-6,0')!.resourceQuality);
  }
});

test('pesticide pairs differ only in exposure, reduced to one quarter', () => {
  for (const seed of ['one', 'two', 'three']) {
    const control = createScenario(config('pesticide', 'control', seed)).map;
    const intervention = createScenario(config('pesticide', 'intervention', seed)).map;
    let exposed = 0;
    for (const [key, before] of control) {
      const after = intervention.get(key)!;
      assert.deepEqual(without(before, ['pesticideLevel']), without(after, ['pesticideLevel']));
      assert.equal(after.pesticideLevel, before.pesticideLevel * 0.25);
      if (before.pesticideLevel > 0) exposed++;
    }
    assert(exposed > 0);
    assert.equal(intervention.get('-1,1')!.pesticideLevel, 0.15);
  }
});

test('hoverfly pairs move equal floral enhancements while conserving actual adult food yield', () => {
  for (let seed = 0; seed < 20; seed++) {
    const control = createScenario(config('hoverfly', 'control', String(seed))).map;
    const intervention = createScenario(config('hoverfly', 'intervention', String(seed))).map;
    const expected = new Set([...NEAR_APHID_FLOWERS, ...FAR_APHID_FLOWERS].map(point => point.join(',')));
    let totalBefore = 0;
    let totalAfter = 0;
    for (const [key, before] of control) {
      const after = intervention.get(key)!;
      assert.deepEqual(without(before, ['resourceQuality', 'flowerStrip']), without(after, ['resourceQuality', 'flowerStrip']));
      if (!expected.has(key)) assert.deepEqual(after, before);
      totalBefore += before.resourceQuality;
      totalAfter += after.resourceQuality;
    }
    assert.equal(totalBefore, totalAfter);
    assert.equal([...control.values()].filter(cell => cell.aphids).length, 2);
    for (const [q, r] of APHID_PATCHES) {
      assert.equal(control.get(`${q},${r}`)!.aphids, true);
      assert.equal(intervention.get(`${q},${r}`)!.aphids, true);
      assert(control.get(`${q},${r}`)!.resourceQuality >= 35 && control.get(`${q},${r}`)!.resourceQuality <= 54);
      assert.deepEqual(control.get(`${q},${r}`), intervention.get(`${q},${r}`));
    }
    for (const [index, point] of NEAR_APHID_FLOWERS.entries()) {
      const baseline = control.get(point.join(','))!;
      const enhanced = intervention.get(point.join(','))!;
      const far = FAR_APHID_FLOWERS[index].join(',');
      assert(baseline.resourceQuality >= 35 && baseline.resourceQuality <= 54);
      assert.equal(enhanced.resourceQuality, baseline.resourceQuality + 40);
      assert.equal(baseline.flowerStrip, false);
      assert.equal(enhanced.flowerStrip, true);
      assert.equal(baseline.resourceQuality, intervention.get(far)!.resourceQuality, 'near and far baseline supplies must match');
      assert.equal(enhanced.resourceQuality, control.get(far)!.resourceQuality, 'near and far enhanced supplies must match');
      assert(Math.min(...APHID_PATCHES.map(patch => dist(point, patch))) <= 1);
    }
    for (const point of FAR_APHID_FLOWERS) {
      assert.equal(control.get(point.join(','))!.flowerStrip, true);
      assert.equal(intervention.get(point.join(','))!.flowerStrip, false);
      assert(Math.min(...APHID_PATCHES.map(patch => dist(point, patch))) >= 4);
    }
    for (const species of Object.values(SpeciesType)) for (const weather of Object.values(Weather)) for (const impaired of [false, true]) {
      assert.deepEqual(foodSupply(control, species, weather, impaired), foodSupply(intervention, species, weather, impaired), `${seed}: ${species}, ${weather}, impaired=${impaired}`);
    }
  }
});

test('all scenarios retain valid coordinates, initial food and distributed shelter across seeds', () => {
  for (let seed = 0; seed < 50; seed++) for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
    for (const treatment of ['control', 'intervention'] as const) {
      const map = createScenario(config(scenarioId, treatment, String(seed))).map;
      assert.equal(map.size, 1 + 3 * MAP_RADIUS * (MAP_RADIUS + 1));
      assert.equal(map.get('0,0')!.type, TerrainType.NEST);
      assert.equal(map.get('0,0')!.resourceQuality, 0);
      assert.equal(map.get('0,-1')!.resourceQuality, 80);
      assert.equal(map.get('0,-1')!.pesticideLevel, 0);
      assert.equal(map.get('1,-1')!.type, TerrainType.URBAN);
      assert.equal([...map.values()].filter(cell => cell.isRevealed).length, 7);
      for (const cell of map.values()) {
        assert(dist([0, 0], [cell.q, cell.r]) <= MAP_RADIUS);
        assert(cell.resourceQuality >= 0 && cell.resourceQuality <= 100);
        assert(cell.pesticideLevel >= 0 && cell.pesticideLevel <= 1);
        if ([TerrainType.ROAD, TerrainType.WATER, TerrainType.NEST].includes(cell.type)) {
          assert.equal(cell.resourceQuality, 0);
          assert.equal(cell.aphids, false);
        } else {
          assert(cell.resourceQuality > 0, `${scenarioId} ${treatment} seed ${seed}: ${cell.type} (${cell.q},${cell.r}) must have flowers`);
        }
        if (cell.q === 2) assert.equal(cell.type, TerrainType.ROAD);
      }
    }
  }
});

test('every floral tile yields food even in rain with toxicity impairment', () => {
  for (let seed = 0; seed < 20; seed++) for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
    for (const treatment of ['control', 'intervention'] as const) {
      const map = createScenario(config(scenarioId, treatment, String(seed))).map;
      for (const species of Object.values(SpeciesType)) {
        const state = previewState(map, species, Weather.RAINY, true);
        for (const cell of map.values()) {
          if ([TerrainType.ROAD, TerrainType.WATER, TerrainType.NEST].includes(cell.type)) continue;
          const preview = getForagePreview({ ...state, player: { ...state.player, q: cell.q, r: cell.r } });
          assert(preview && preview.harvest > 0, `${scenarioId} ${treatment} seed ${seed}: ${species} must harvest from (${cell.q},${cell.r})`);
        }
      }
    }
  }
});

test('scenario background floral supplies vary deterministically across seeds', () => {
  for (const [scenarioId, points] of [
    ['flower-strips', FLOWER_CORRIDOR],
    ['hoverfly', [...NEAR_APHID_FLOWERS, ...FAR_APHID_FLOWERS]],
    ['pesticide', APHID_PATCHES]
  ] as const) {
    for (const point of points) {
      const qualities = new Set<number>();
      for (let seed = 0; seed < 20; seed++) {
        const settings = config(scenarioId, 'control', String(seed));
        const first = createScenario(settings).map.get(point.join(','))!.resourceQuality;
        const repeat = createScenario(settings).map.get(point.join(','))!.resourceQuality;
        assert.equal(first, repeat);
        qualities.add(first);
      }
      assert(qualities.size > 1, `${scenarioId} (${point.join(',')}) should vary with the seed`);
    }
  }
});
