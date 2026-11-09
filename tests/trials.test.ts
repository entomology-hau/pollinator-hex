import assert from 'node:assert/strict';
import test from 'node:test';
import { MODEL_VERSION, SPECIES_DATA } from '../constants';
import { SpeciesType, TrialResult, Weather } from '../types';
import { createInitialState } from '../game/rules';
import { DEFAULT_CONFIG } from '../game/scenarios';
import { compareTrials, createTrialResult, csvCell, eventsToCsv, isTrialResult, loadTrials, MAX_SAVED_TRIALS, resultsToCsv, saveTrials, TRIAL_STORAGE_KEY, TRIAL_STORAGE_VERSION, TrialStorage } from '../game/trials';

const result = (overrides: Partial<TrialResult> = {}): TrialResult => ({
  id: 'trial-1', modelVersion: MODEL_VERSION, finishedAt: '2026-11-09T12:00:00.000Z',
  config: { ...DEFAULT_CONFIG }, species: SpeciesType.BUMBLEBEE,
  survived: false, dayReached: 5, completedDays: 4, causeOfDeath: 'Starvation',
  resourcesCollected: 120, score: 2, scoreLabel: 'Workers supported', energyRemaining: 0, toxicity: 5.5,
  metrics: { distance: 12, forageVisits: 3, exposureEvents: 1, toxicityAccumulated: 5.5, collisions: 0, energySpent: 100, completedDays: 4 },
  settings: '{"version":"3.0","note":"model assumptions"}', weatherSchedule: [Weather.SUNNY, Weather.CLOUDY],
  history: [{ day: 1, event: 'Collected "pollen", then returned.\nNest provisioned.' }, { day: 5, event: 'Simulation ended: starvation.' }],
  ...overrides,
});
const memory = (initial: string | null = null): TrialStorage & { value: string | null } => ({
  value: initial,
  getItem(key) { assert.equal(key, TRIAL_STORAGE_KEY); return this.value; },
  setItem(key, value) { assert.equal(key, TRIAL_STORAGE_KEY); this.value = value; },
});

/** Tiny RFC4180 reader ensures quoting survives commas, quotes and line breaks. */
const parseCsv = (input: string): string[][] => {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (character === '\r' && text[i + 1] === '\n' && !quoted) { row.push(cell); rows.push(row); row = []; cell = ''; i++; }
    else cell += character;
  }
  return rows;
};

test('finished snapshots retain independent settings, metrics and action history', () => {
  const state = createInitialState();
  state.status = 'GAME_OVER'; state.species = SPECIES_DATA[SpeciesType.BUMBLEBEE];
  state.day = 4; state.metrics.completedDays = 3;
  state.player.pollen = 124;
  state.player.isAlive = false; state.player.deathReason = 'Starvation';
  state.player.history = [{ day: 4, event: 'Simulation ended.' }];
  state.weatherSchedule = [Weather.SUNNY];
  const saved = createTrialResult(state, '2026-11-09T12:00:00.000Z', 'fixed-id');
  assert.equal(saved.id, 'fixed-id'); assert.equal(saved.resourcesCollected, 124); assert.equal(saved.score, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, 'deliveredPollen'), false); assert.equal(Object.prototype.hasOwnProperty.call(saved, 'floralReserve'), false);
  assert.equal(saved.completedDays, 3); assert.equal(saved.modelVersion, MODEL_VERSION);
  assert.ok(isTrialResult(saved));
  const settings = JSON.parse(saved.settings);
  assert.equal(settings.species.name, SpeciesType.BUMBLEBEE);
  assert.equal(settings.config.seed, state.config.seed);
  assert.equal(settings.constants.MODEL_VERSION, MODEL_VERSION);
  state.config.seed = 'changed'; state.metrics.distance = 99; state.player.history[0].event = 'Changed'; state.weatherSchedule[0] = Weather.RAINY;
  assert.notEqual(saved.config.seed, state.config.seed); assert.notEqual(saved.metrics.distance, 99);
  assert.equal(saved.history[0].event, 'Simulation ended.'); assert.equal(saved.weatherSchedule[0], Weather.SUNNY);
  assert.throws(() => createTrialResult(createInitialState()), /finished/);
});

test('summary CSV exactly preserves data, Unicode and embedded JSON', () => {
  const saved = result({ config: { ...DEFAULT_CONFIG, seed: 'seed, "flowers" 🌼' } });
  const rows = parseCsv(resultsToCsv([saved]));
  assert.equal(rows.length, 2); assert.equal(rows[0].length, rows[1].length);
  const values = Object.fromEntries(rows[0].map((header, index) => [header, rows[1][index]]));
  assert.equal(values.seed, saved.config.seed);
  assert.equal(values.resources_collected, String(saved.resourcesCollected));
  assert.equal(values.resource_unit, 'mg pollen-equivalent');
  assert.equal(Object.prototype.hasOwnProperty.call(values, 'legacy_resource_details_json'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(values, 'trial_number'), false);
  assert.equal(values.reproductive_output, String(saved.score));
  assert.equal(values.output_unit, saved.scoreLabel);
  assert.equal(values.settings_json, saved.settings);
  assert.equal(values.survived_season, 'no'); assert.equal(values.toxicity_load, '5.5');
});

test('CSV neutralises formula-like text without changing numeric negatives', () => {
  for (const text of ['=1+1', '+SUM(A1)', '-formula', '@call', '\t=1', '  =1']) {
    assert.equal(parseCsv(`${csvCell(text)}\r\n`)[0][0], `'${text}`);
  }
  assert.equal(csvCell(-12), '"-12"');
  assert.equal(parseCsv(resultsToCsv([result({ config: { ...DEFAULT_CONFIG, seed: '=1+1' } })]))[1][5], "'=1+1");
});

test('action CSV keeps event order, identities and multiline quoted text', () => {
  const saved = result(); const rows = parseCsv(eventsToCsv([saved]));
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], saved.id); assert.equal(rows[1][6], '1'); assert.equal(rows[2][6], '2');
  assert.equal(rows[1][8], saved.history[0].event);
  assert.equal(rows[2][7], '5');
  assert.equal(rows[0].includes('trial_number'), false);
});

test('valid saved trials round-trip and retain the newest 100', () => {
  const storage = memory();
  const all = Array.from({ length: 103 }, (_, index) => result({ id: `trial-${index}` }));
  assert.deepEqual(saveTrials(all, storage), { error: null });
  const loaded = loadTrials(storage);
  assert.equal(loaded.error, null); assert.equal(loaded.results.length, MAX_SAVED_TRIALS);
  assert.equal(loaded.results[0].id, 'trial-3'); assert.equal(loaded.results.at(-1)?.id, 'trial-102');
  assert.equal(loadTrials(memory()).results.length, 0);
});

test('unknown, duplicate or malformed saved data is rejected without overwriting it', () => {
  for (const value of ['not json', JSON.stringify({ version: 99, results: [result()] }), JSON.stringify({ version: TRIAL_STORAGE_VERSION, results: [{ ...result(), metrics: null }] }), JSON.stringify({ version: TRIAL_STORAGE_VERSION, results: [result(), result()] })]) {
    const storage = memory(value); const loaded = loadTrials(storage);
    assert.equal(loaded.results.length, 0); assert.ok(loaded.error); assert.equal(storage.value, value);
  }
  const storage = memory('preserve this');
  assert.ok(saveTrials([result({ score: NaN })], storage).error); assert.equal(storage.value, 'preserve this');
  assert.ok(saveTrials([result(), result()], storage).error);
});

test('storage failures return actionable errors while in-memory results remain usable', () => {
  const storage: TrialStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.match(loadTrials(storage).error!, /could not be read/);
  assert.match(saveTrials([result()], storage).error!, /export your results/);
  assert.equal(parseCsv(resultsToCsv([result()])).length, 2);
});

test('comparison gives distinct seeds equal weight and separates species, versions and units', () => {
  const a = result({ id: 'a', score: 0 });
  const repeat = result({ id: 'repeat', score: 10 });
  const b = result({ id: 'b', score: 20, config: { ...DEFAULT_CONFIG, seed: 'second' } });
  const intervention = result({ id: 'treatment', score: 8, config: { ...DEFAULT_CONFIG, treatment: 'intervention' } });
  const hoverfly = result({ id: 'hoverfly', species: SpeciesType.HOVERFLY, scoreLabel: 'Eggs supported' });
  const old = result({ id: 'old', modelVersion: 'old' });
  const otherUnit = result({ id: 'unit', scoreLabel: 'different unit' });
  const groups = compareTrials([a, repeat, b, intervention, hoverfly, old, otherUnit]);
  assert.equal(groups.length, 4);
  const group = groups.find(item => item.species === SpeciesType.BUMBLEBEE && item.modelVersion === MODEL_VERSION && item.outputLabel === a.scoreLabel)!;
  assert.equal(group.control.runs, 3); assert.equal(group.control.seeds, 2);
  assert.equal(group.control.meanScore, 12.5); // mean(mean(0,10),20), rather than weighting repeated practice twice
  assert.equal(group.intervention.meanScore, 8); assert.equal(group.matchedSeeds, 1);
  assert.equal(groups.find(item => item.species === SpeciesType.HOVERFLY)!.intervention.meanScore, null);
});

test('model 2.0 records remain unchanged through loading, saving and simplified exports', () => {
  const legacy = result({
    id: 'legacy', modelVersion: '2.0', resourcesCollected: 80, carriedPollen: 15,
    deliveredPollen: 60, floralReserve: 0, ovipositionBatches: 0, score: 1,
    settings: '{"version":"2.0","note":"delivered resources only"}',
  });
  const source = JSON.stringify({ version: 1, results: [legacy] });
  const storage = memory(source);
  const loaded = loadTrials(storage);
  assert.equal(loaded.error, null); assert.equal(storage.value, source);
  assert.deepEqual(loaded.results, [legacy]);
  const current = result({ id: 'current', resourcesCollected: 120, score: 2 });
  assert.deepEqual(saveTrials([...loaded.results, current], storage), { error: null });
  assert.equal(JSON.parse(storage.value!).version, TRIAL_STORAGE_VERSION);
  assert.deepEqual(loadTrials(storage).results, [legacy, current]);
  const rows = parseCsv(resultsToCsv([legacy, current]));
  const legacyColumn = rows[0].indexOf('legacy_resource_details_json');
  assert.ok(legacyColumn >= 0);
  assert.deepEqual(JSON.parse(rows[1][legacyColumn]), { carriedPollen: 15, deliveredPollen: 60, floralReserve: 0, ovipositionBatches: 0 });
  assert.equal(rows[2][legacyColumn], '');
  assert.equal(rows[0].includes('pollen_delivered_mg_equivalent'), false);
  const incompleteLegacy = { ...legacy }; delete incompleteLegacy.deliveredPollen;
  assert.equal(isTrialResult(incompleteLegacy), false);
});

test('old and simplified reproductive models never share a comparison group', () => {
  const legacy = result({ id: 'legacy', modelVersion: '2.0', score: 1, carriedPollen: 0, deliveredPollen: 60, floralReserve: 0, ovipositionBatches: 0 });
  const current = result({ id: 'current', modelVersion: '3.0', score: 8 });
  const currentTreatment = result({ id: 'current-treatment', modelVersion: '3.0', score: 12, config: { ...DEFAULT_CONFIG, treatment: 'intervention' } });
  const groups = compareTrials([legacy, current, currentTreatment]);
  assert.equal(groups.length, 2);
  assert.equal(groups.find(group => group.modelVersion === '2.0')!.control.meanScore, 1);
  const currentGroup = groups.find(group => group.modelVersion === '3.0')!;
  assert.equal(currentGroup.control.meanScore, 8);
  assert.equal(currentGroup.intervention.meanScore, 12);
  assert.equal(currentGroup.matchedSeeds, 1);
});
