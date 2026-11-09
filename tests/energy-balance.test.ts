import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_DAYS, SPECIES_DATA } from '../constants';
import { canForage, endDay, forage, getMovePreview, move, startGame } from '../game/rules';
import { DEFAULT_CONFIG, SCENARIOS } from '../game/scenarios';
import { GameState, ScenarioId, SpeciesType, Treatment, Weather } from '../types';

// A simple classroom routine: one nearby flower visit, then return to shelter.
// Both patches are visible, pesticide-free and adjacent to the nest in every scenario.
const starter = { q: 0, r: -1 };
const garden = { q: 1, r: -1 };
const nest = { q: 0, r: 0 };
const seeds = ['hau-ecology-01', ...Array.from({ length: 19 }, (_, index) => `class-energy-${index + 1}`)];

function fly(state: GameState, target: { q: number; r: number }, context: string): GameState {
  assert.equal(getMovePreview(state, target.q, target.r).valid, true, `${context}: flight remains affordable`);
  const next = move(state, target.q, target.r);
  assert.equal(next.player.isAlive, true, `${context}: flight does not exhaust all energy`);
  return next;
}

function feed(state: GameState, context: string): GameState {
  assert.equal(canForage(state), true, `${context}: flowers are replenished and feeding is possible`);
  const next = forage(state);
  assert.equal(next.player.isAlive, true, `${context}: feeding keeps the pollinator alive`);
  return next;
}

for (const species of Object.values(SpeciesType)) {
  test(`${species}: a daily nearby flower visit supports a complete season across classroom seeds and conditions`, () => {
    for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
      for (const treatment of ['control', 'intervention'] as Treatment[]) {
        for (const seed of seeds) {
          let state = startGame(SPECIES_DATA[species], { scenarioId, treatment, seed, trial: 1 });
          for (let day = 1; day <= MAX_DAYS; day++) {
            const context = `${species}, ${scenarioId}, ${treatment}, ${seed}, day ${day}`;
            state = fly(state, day % 2 === 1 ? starter : garden, context);
            state = feed(state, context);
            state = fly(state, nest, context);
            state = endDay(state);
            assert.equal(state.player.isAlive, true, `${context}: survives daily maintenance`);
          }
          assert.equal(state.status, 'GAME_OVER');
          assert.equal(state.metrics.completedDays, MAX_DAYS);
          assert.equal(state.metrics.forageVisits, MAX_DAYS);
        }
      }
    }
  });

  test(`${species}: two nearby feeds each day can sustain even an entirely rainy season`, () => {
    let state = startGame(SPECIES_DATA[species], DEFAULT_CONFIG);
    state = { ...state, weather: Weather.RAINY, weatherSchedule: Array(MAX_DAYS).fill(Weather.RAINY) };
    for (let day = 1; day <= MAX_DAYS; day++) {
      const context = `${species}, rainy season, day ${day}`;
      state = feed(fly(state, starter, context), context);
      state = feed(fly(state, garden, context), context);
      state = endDay(fly(state, nest, context));
      assert.equal(state.player.isAlive, true, `${context}: survives daily maintenance`);
    }
    assert.equal(state.metrics.completedDays, MAX_DAYS);
    assert.equal(state.metrics.forageVisits, MAX_DAYS * 2);
  });
}
