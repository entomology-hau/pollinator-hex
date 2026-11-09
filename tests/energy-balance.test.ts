import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_DAYS, SPECIES_DATA } from '../constants';
import { canForage, endDay, forage, getMovePreview, move, startGame } from '../game/rules';
import { DEFAULT_CONFIG, SCENARIOS } from '../game/scenarios';
import { GameState, HexCell, ScenarioId, SpeciesType, TerrainType, Treatment, Weather } from '../types';

const nest = { q: 0, r: 0 };
const nearbyFlowers = [{ q: 0, r: -1 }, { q: 1, r: -1 }];
const seeds = ['hau-ecology-01', ...Array.from({ length: 19 }, (_, index) => `class-energy-${index + 1}`)];

function fly(state: GameState, target: { q: number; r: number }, context: string): GameState {
  assert.equal(getMovePreview(state, target.q, target.r).valid, true, `${context}: affordable flight`);
  const next = move(state, target.q, target.r);
  assert.equal(next.player.isAlive, true, `${context}: energy remains for the next action`);
  return next;
}

for (const species of Object.values(SpeciesType)) {
  test(`${species}: repeated meadow visits spend the day's energy budget instead of refilling it`, () => {
    // Equal-quality flowers isolate travel and feeding from random hazards.
    const cells: HexCell[] = Array.from({ length: 7 }, (_, q) => ({
      q, r: 0, type: q === 0 ? TerrainType.NEST : TerrainType.MEADOW,
      isRevealed: true, hasForagedToday: false, lastForagedDay: null,
      resourceQuality: q === 0 ? 0 : 80, pesticideLevel: 0, aphids: false, flowerStrip: false,
    }));
    let state = startGame(SPECIES_DATA[species], DEFAULT_CONFIG);
    state = { ...state, weather: Weather.SUNNY, map: new Map(cells.map(cell => [`${cell.q},${cell.r}`, cell])) };
    for (let q = 1; q <= 6; q++) {
      const before = state.player.energy;
      state = forage(fly(state, { q, r: 0 }, `${species}, flower ${q}`));
      assert.ok(state.player.energy < before, 'moving to and collecting another meadow must use reserves');
    }
    const resources = state.player.pollen;
    while (state.player.q > 0) {
      state = fly(state, { q: Math.max(0, state.player.q - state.species!.flightRange), r: 0 }, 'return to nest');
    }
    assert.equal(state.player.pollen, resources, 'return travel produces no reproductive resources');
    assert.equal(state.metrics.distance, 12);
    assert.equal(state.metrics.forageVisits, 6);
    assert.ok(state.player.energy < state.species!.maxEnergy / 2, 'a long collecting trip leaves a meaningful energy deficit');
    const beforeRest = state.player.energy;
    state = endDay(state);
    assert.ok(state.player.energy > beforeRest, 'rest is the recovery decision');
    assert.ok(state.player.energy < state.species!.maxEnergy, 'one rest does not erase the cost of a long trip');
    assert.equal(state.player.pollen, resources, 'rest does not create reproductive output');
  });

  test(`${species}: a cautious season remains viable, but resting through it produces no resources`, () => {
    for (const scenarioId of Object.keys(SCENARIOS) as ScenarioId[]) {
      for (const treatment of ['control', 'intervention'] as Treatment[]) {
        for (const seed of seeds) {
          const config = { scenarioId, treatment, seed, trial: 1 };
          let active = startGame(SPECIES_DATA[species], config);
          let idle = startGame(SPECIES_DATA[species], config);
          for (let day = 1; day <= MAX_DAYS; day++) {
            const context = `${species}, ${scenarioId}, ${treatment}, ${seed}, day ${day}`;
            // Visit the two known safe flowers when recovered, then rest.
            for (const target of nearbyFlowers) {
              const atTarget = { ...active, player: { ...active.player, ...target } };
              if (!canForage(atTarget)) continue;
              active = forage(fly(active, target, context));
              assert.equal(active.player.isAlive, true, `${context}: can finish collecting`);
            }
            if (active.player.q !== 0 || active.player.r !== 0) active = fly(active, nest, context);
            active = endDay(active);
            idle = endDay(idle);
            assert.equal(active.player.isAlive, true, `${context}: sensible trips remain viable`);
          }
          assert.equal(active.status, 'GAME_OVER');
          assert.equal(active.metrics.completedDays, MAX_DAYS);
          assert.equal(active.metrics.forageVisits, 10, 'three-day flower recovery limits repeated local collection');
          assert.ok(active.player.pollen > 0);
          assert.equal(idle.player.isAlive, true);
          assert.equal(idle.metrics.completedDays, MAX_DAYS);
          assert.equal(idle.player.pollen, 0, 'surviving without collecting earns no reproductive resources');
          assert.equal(idle.metrics.forageVisits, 0);
        }
      }
    }
  });
}
