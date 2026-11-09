import * as constants from '../constants';
import { GameState, RunConfig, RunMetrics, SpeciesType, TrialResult, Weather } from '../types';
import { getReproductiveScore, getResourceQuantity, ROAD_COLLISION_CHANCE, ROAD_COLLISION_ENERGY_LOSS } from './rules';
import { SCENARIOS } from './scenarios';

export const TRIAL_STORAGE_KEY = 'pollinator-hex-trials';
export const TRIAL_STORAGE_VERSION = 2;
export const MAX_SAVED_TRIALS = 100;
export interface TrialStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LoadedTrials { results: TrialResult[]; error: string | null }

const makeId = (): string => globalThis.crypto?.randomUUID?.() ?? `trial-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Snapshot a finished run; later game actions cannot alter its exported records. */
export const createTrialResult = (state: GameState, finishedAt = new Date().toISOString(), id = makeId()): TrialResult => {
  if (state.status !== 'GAME_OVER' || !state.species) throw new Error('Only a finished simulation can be recorded.');
  if (!Number.isFinite(Date.parse(finishedAt)) || !id.trim()) throw new Error('A trial needs a valid completion date and identifier.');
  const outcome = getReproductiveScore(state);
  const result: TrialResult = {
    id, modelVersion: constants.MODEL_VERSION, finishedAt,
    config: { ...state.config }, species: state.species.name,
    survived: state.player.isAlive, dayReached: state.day, completedDays: state.metrics.completedDays,
    causeOfDeath: state.player.deathReason ?? '', resourcesCollected: getResourceQuantity(state.species.name, state.player.pollen),
    score: outcome.score, scoreLabel: outcome.label, energyRemaining: state.player.energy,
    toxicity: state.player.toxicity, metrics: { ...state.metrics },
    settings: JSON.stringify({
      constants, species: state.species, scenario: SCENARIOS[state.config.scenarioId], config: state.config,
      roadCollisionChance: ROAD_COLLISION_CHANCE, roadCollisionEnergyLoss: ROAD_COLLISION_ENERGY_LOSS,
      unshelteredNightPredationChance: 0.15,
      resourceAccounting: {
        rawResourceUnits: state.player.pollen,
        pollenMgPerUnit: state.species.name === SpeciesType.HOVERFLY ? null : getResourceQuantity(state.species.name, 1),
        resourceUnit: state.species.name === SpeciesType.HOVERFLY ? 'resource units' : 'mg pollen-equivalent',
      },
      outputMeaning: 'Fictional reproductive output derived from model resources; not a prediction of field reproduction.',
    }),
    weatherSchedule: [...state.weatherSchedule], history: state.player.history.map(entry => ({ ...entry })),
  };
  if (!isTrialResult(result)) throw new Error('The finished simulation contains invalid trial data.');
  return result;
};

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string';
const count = (value: unknown): value is number => number(value) && Number.isInteger(value);
const metricKeys: (keyof RunMetrics)[] = ['distance', 'forageVisits', 'exposureEvents', 'toxicityAccumulated', 'collisions', 'energySpent', 'completedDays'];

export const isRunConfig = (value: unknown): value is RunConfig => record(value)
  && ['flower-strips', 'pesticide', 'hoverfly'].includes(String(value.scenarioId))
  && ['control', 'intervention'].includes(String(value.treatment))
  && text(value.seed) && value.seed.trim().length > 0 && value.seed.length <= 64
  && count(value.trial) && value.trial >= 1;

export const isTrialResult = (value: unknown): value is TrialResult => {
  if (!record(value) || !text(value.id) || !value.id.trim() || !text(value.modelVersion) || !value.modelVersion
    || !text(value.finishedAt) || !Number.isFinite(Date.parse(value.finishedAt)) || !isRunConfig(value.config)
    || !Object.values(SpeciesType).includes(value.species as SpeciesType) || typeof value.survived !== 'boolean'
    || !text(value.causeOfDeath) || !text(value.scoreLabel) || !text(value.settings)) return false;
  for (const key of ['dayReached', 'completedDays', 'resourcesCollected', 'score', 'energyRemaining', 'toxicity']) {
    if (!number(value[key])) return false;
  }
  // Preserve original quantities in older records without requiring them in the simpler model.
  for (const key of ['carriedPollen', 'deliveredPollen', 'floralReserve', 'ovipositionBatches']) {
    if ((value.modelVersion === '2.0' || value[key] !== undefined) && !number(value[key])) return false;
  }
  if (!count(value.dayReached) || value.dayReached < 1 || !count(value.completedDays) || !record(value.metrics)
    || metricKeys.some(key => !number((value.metrics as Record<string, unknown>)[key]))
    || value.completedDays !== value.metrics.completedDays) return false;
  if (!Array.isArray(value.weatherSchedule) || !value.weatherSchedule.length || value.weatherSchedule.some(weather => !Object.values(Weather).includes(weather))) return false;
  if (!Array.isArray(value.history) || value.history.some(entry => !record(entry) || !count(entry.day) || entry.day < 1 || !text(entry.event))) return false;
  try { return record(JSON.parse(value.settings)); } catch { return false; }
};

/** No entry is silently discarded: malformed/unknown data stays untouched in storage. */
export const loadTrials = (storage?: TrialStorage): LoadedTrials => {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return { results: [], error: 'Saved trials are unavailable in this browser. You can still export completed runs.' };
    const saved = target.getItem(TRIAL_STORAGE_KEY);
    if (saved === null) return { results: [], error: null };
    const parsed: unknown = JSON.parse(saved);
    if (!record(parsed) || (parsed.version !== 1 && parsed.version !== TRIAL_STORAGE_VERSION) || !Array.isArray(parsed.results)
      || !parsed.results.every(isTrialResult) || new Set(parsed.results.map(result => result.id)).size !== parsed.results.length) {
      return { results: [], error: 'Saved trial data could not be read. It has not been changed; export any new results before clearing history.' };
    }
    return { results: parsed.results.slice(-MAX_SAVED_TRIALS), error: null };
  } catch {
    return { results: [], error: 'Saved trials could not be read. Browser storage may be blocked; existing data has not been changed.' };
  }
};

export const saveTrials = (results: TrialResult[], storage?: TrialStorage): { error: string | null } => {
  if (!results.every(isTrialResult) || new Set(results.map(result => result.id)).size !== results.length) return { error: 'Trial history contains invalid records and was not saved.' };
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return { error: 'Trial history could not be saved in this browser. Export your results before leaving.' };
    target.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ version: TRIAL_STORAGE_VERSION, results: results.slice(-MAX_SAVED_TRIALS) }));
    return { error: null };
  } catch {
    return { error: 'Trial history could not be saved. Browser storage may be full or blocked; export your results before leaving.' };
  }
};

type CsvValue = string | number | boolean;
/** Quote every field and neutralise spreadsheet formula prefixes in text only. */
export const csvCell = (value: CsvValue): string => {
  let content = typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value);
  if (typeof value === 'string' && (/^[\t\r\n]/.test(content) || /^\s*[=+\-@]/.test(content))) content = `'${content}`;
  return `"${content.replace(/"/g, '""')}"`;
};
const csv = (rows: CsvValue[][]): string => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

const legacyResourceDetails = (result: TrialResult): Record<string, number> => {
  const details: Record<string, number> = {};
  for (const key of ['carriedPollen', 'deliveredPollen', 'floralReserve', 'ovipositionBatches'] as const) {
    if (result[key] !== undefined) details[key] = result[key]!;
  }
  return details;
};

export const resultsToCsv = (results: TrialResult[]): string => {
  const hasLegacyDetails = results.some(result => Object.keys(legacyResourceDetails(result)).length > 0);
  return csv([
    ['run_id', 'model_version', 'completed_at_utc', 'scenario_id', 'condition', 'seed', 'pollinator', 'survived_season', 'day_reached', 'days_completed', 'cause_of_death', 'resources_collected', 'resource_unit', 'reproductive_output', 'output_unit', 'energy_remaining', 'toxicity_load', 'distance_hexes', 'forage_visits', 'exposure_events', 'toxicity_accumulated', 'road_collisions', 'energy_spent', 'weather_schedule', 'settings_json', ...(hasLegacyDetails ? ['legacy_resource_details_json'] : [])],
    ...results.map(result => [
      result.id, result.modelVersion, result.finishedAt, result.config.scenarioId, result.config.treatment, result.config.seed,
      result.species, result.survived, result.dayReached, result.completedDays, result.causeOfDeath, result.resourcesCollected,
      result.species === SpeciesType.HOVERFLY ? 'resource units' : 'mg pollen-equivalent', result.score, result.scoreLabel,
      result.energyRemaining, result.toxicity, result.metrics.distance, result.metrics.forageVisits, result.metrics.exposureEvents,
      result.metrics.toxicityAccumulated, result.metrics.collisions, result.metrics.energySpent, result.weatherSchedule.join('|'), result.settings,
      ...(hasLegacyDetails ? [Object.keys(legacyResourceDetails(result)).length ? JSON.stringify(legacyResourceDetails(result)) : ''] : []),
    ]),
  ]);
};

export const eventsToCsv = (results: TrialResult[]): string => csv([
  ['run_id', 'model_version', 'scenario_id', 'condition', 'seed', 'pollinator', 'event_number', 'day', 'event'],
  ...results.flatMap(result => result.history.map((entry, index) => [
    result.id, result.modelVersion, result.config.scenarioId, result.config.treatment, result.config.seed,
    result.species, index + 1, entry.day, entry.event,
  ])),
]);

export interface ConditionSummary { runs: number; seeds: number; meanScore: number | null; survivalRate: number | null; meanDistance: number | null }
export interface TrialComparison {
  key: string; scenarioId: RunConfig['scenarioId']; species: SpeciesType; modelVersion: string; outputLabel: string;
  control: ConditionSummary; intervention: ConditionSummary; matchedSeeds: number;
}

const summariseCondition = (results: TrialResult[]): ConditionSummary => {
  const bySeed = new Map<string, TrialResult[]>();
  for (const result of results) bySeed.set(result.config.seed, [...(bySeed.get(result.config.seed) ?? []), result]);
  const seedGroups = [...bySeed.values()];
  const mean = (select: (result: TrialResult) => number) => seedGroups.length
    ? seedGroups.reduce((sum, group) => sum + group.reduce((total, result) => total + select(result), 0) / group.length, 0) / seedGroups.length : null;
  return { runs: results.length, seeds: bySeed.size, meanScore: mean(result => result.score), survivalRate: mean(result => result.survived ? 1 : 0), meanDistance: mean(result => result.metrics.distance) };
};

/** Separate species/model versions; repeated practice runs do not outweigh other seeds. */
export const compareTrials = (results: TrialResult[]): TrialComparison[] => {
  const groups = new Map<string, TrialResult[]>();
  for (const result of results) {
    const key = JSON.stringify([result.config.scenarioId, result.species, result.modelVersion, result.scoreLabel]);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return [...groups.entries()].map(([key, group]) => {
    const control = group.filter(result => result.config.treatment === 'control');
    const intervention = group.filter(result => result.config.treatment === 'intervention');
    const controlSeeds = new Set(control.map(result => result.config.seed));
    const interventionSeeds = new Set(intervention.map(result => result.config.seed));
    return { key, scenarioId: group[0].config.scenarioId, species: group[0].species, modelVersion: group[0].modelVersion, outputLabel: group[0].scoreLabel,
      control: summariseCondition(control), intervention: summariseCondition(intervention),
      matchedSeeds: [...controlSeeds].filter(seed => interventionSeeds.has(seed)).length };
  });
};
