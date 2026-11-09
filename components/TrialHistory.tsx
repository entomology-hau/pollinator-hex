import React, { useMemo, useState } from 'react';
import { RunConfig, SpeciesType, TrialResult } from '../types';
import { SCENARIOS } from '../game/scenarios';
import { compareTrials } from '../game/trials';

interface Props {
  results: TrialResult[];
  onReplay: (config: RunConfig, species: SpeciesType) => void;
  onExportSummary: () => void;
  onExportEvents: () => void;
  onClear: () => void;
}
const value = (number: number | null, suffix = '') => number === null ? '—' : `${number.toFixed(1)}${suffix}`;

export const TrialHistory: React.FC<Props> = ({ results, onReplay, onExportSummary, onExportEvents, onClear }) => {
  const [scenario, setScenario] = useState('all');
  const [species, setSpecies] = useState('all');
  const filtered = useMemo(() => results.filter(result => (scenario === 'all' || result.config.scenarioId === scenario) && (species === 'all' || result.species === species)), [results, scenario, species]);
  const comparisons = useMemo(() => compareTrials(filtered), [filtered]);
  return (
    <section className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left sm:p-6" aria-labelledby="trial-history-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 id="trial-history-heading" className="text-xl font-bold text-amber-200">Saved results</h2>
        <p className="text-sm text-slate-300">{results.length} saved {results.length === 1 ? 'run' : 'runs'} · latest 100 kept</p>
      </div>
      <p className="text-sm text-slate-300">For your class graph, record the pollinator, condition and reproductive output. These results are saved only in this browser.</p>
      {results.length === 0 ? <p className="mt-4 text-sm text-slate-200">Finish a simulation to save your first result. Include zero outcomes in your class graph.</p> : <>
        <div className="flex flex-wrap gap-3 my-4">
          <button type="button" onClick={onExportSummary} className="rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300">Export all {results.length} summaries (CSV)</button>
          <button type="button" onClick={onExportEvents} className="rounded-lg border border-slate-500 px-4 py-3 text-sm hover:bg-slate-800">Export all action histories (CSV)</button>
          <button type="button" onClick={onClear} className="rounded-lg border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">Clear saved history</button>
        </div>
        <div className="flex flex-wrap gap-4 mb-5">
          <label className="flex min-w-0 max-w-full flex-1 basis-64 flex-col gap-1 text-sm text-slate-200">Scenario
            <select value={scenario} onChange={event => setScenario(event.target.value)} className="w-full max-w-full rounded-lg border border-slate-500 bg-slate-800 p-2">
              <option value="all">All scenarios</option>
              {Object.values(SCENARIOS).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 max-w-full flex-1 basis-64 flex-col gap-1 text-sm text-slate-200">Pollinator
            <select value={species} onChange={event => setSpecies(event.target.value)} className="w-full max-w-full rounded-lg border border-slate-500 bg-slate-800 p-2">
              <option value="all">All pollinators</option>
              {Object.values(SpeciesType).map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {comparisons.map(group => <section key={group.key} className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/50 p-4" aria-label={`${SCENARIOS[group.scenarioId].title}: ${group.species}`}>
            <h3 className="font-semibold text-slate-100">{SCENARIOS[group.scenarioId].title} · {group.species}</h3>
            <p className="text-xs text-slate-300 mt-1">Model {group.modelVersion} · {group.outputLabel} · {group.matchedSeeds} {group.matchedSeeds === 1 ? 'seed has' : 'seeds have'} both conditions</p>
            <div className="overflow-x-auto mt-3" tabIndex={0} role="region" aria-label="Condition comparison">
              <table className="w-full text-sm min-w-[350px]">
                <thead><tr className="border-b border-slate-700 text-slate-300"><th className="text-left py-2 pr-3" scope="col">Outcome</th><th className="text-right px-2" scope="col">Control</th><th className="text-right pl-2" scope="col">Treatment</th></tr></thead>
                <tbody className="text-slate-100">
                  <tr><th scope="row" className="text-left py-2 pr-3 font-normal">Runs / distinct seeds</th><td className="text-right px-2">{group.control.runs} / {group.control.seeds}</td><td className="text-right pl-2">{group.intervention.runs} / {group.intervention.seeds}</td></tr>
                  <tr><th scope="row" className="text-left py-2 pr-3 font-normal">Mean reproductive output</th><td className="text-right px-2">{value(group.control.meanScore)}</td><td className="text-right pl-2">{value(group.intervention.meanScore)}</td></tr>
                  <tr><th scope="row" className="text-left py-2 pr-3 font-normal">Survival to season end</th><td className="text-right px-2">{value(group.control.survivalRate === null ? null : group.control.survivalRate * 100, '%')}</td><td className="text-right pl-2">{value(group.intervention.survivalRate === null ? null : group.intervention.survivalRate * 100, '%')}</td></tr>
                  <tr><th scope="row" className="text-left py-2 pr-3 font-normal">Mean distance (hexes)</th><td className="text-right px-2">{value(group.control.meanDistance)}</td><td className="text-right pl-2">{value(group.intervention.meanDistance)}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-300 mt-3">Control: {SCENARIOS[group.scenarioId].controlLabel}. Treatment: {SCENARIOS[group.scenarioId].interventionLabel}.</p>
          </section>)}
        </div>
        {filtered.length > 0 ? <>
          <p className="text-xs text-slate-300 mt-4">Compare results from the same model version. Means give each distinct seed equal weight within a condition. Reproductive outputs are fictionalised teaching quantities. These are descriptive summaries of all displayed seeds, not a paired statistical test; use the same seeds and comparable strategies in both conditions.</p>
          <div className="mt-5 max-h-96 overflow-auto rounded-lg border border-slate-700" tabIndex={0} role="region" aria-label="Saved trial results; scroll horizontally for all columns">
            <table className="w-full min-w-[880px] text-sm">
              <caption className="p-3 text-left text-slate-300">{filtered.length} displayed {filtered.length === 1 ? 'run' : 'runs'}, newest first. Export buttons include all saved runs.</caption>
              <thead className="bg-slate-800 text-slate-200"><tr>{['Pollinator / scenario', 'Condition', 'Seed', 'Outcome', 'Reproductive output', 'Resources gathered', 'Repeat'].map(label => <th key={label} scope="col" className="px-3 py-3 text-left font-semibold">{label}</th>)}</tr></thead>
              <tbody>{[...filtered].reverse().map(result => <tr key={result.id} className="border-t border-slate-700 text-slate-200">
                <th scope="row" className="px-3 py-3 text-left font-normal">{result.species}<span className="block text-xs text-slate-300">{SCENARIOS[result.config.scenarioId].title}</span><span className="block text-xs text-slate-400">Model {result.modelVersion}</span></th>
                <td className="px-3 py-3">{result.config.treatment === 'control' ? 'Control' : 'Treatment'}</td>
                <td className="px-3 py-3 max-w-40 break-words font-mono text-xs">{result.config.seed}</td>
                <td className="px-3 py-3">{result.survived ? 'Season survived' : `Died on day ${result.dayReached}`}<span className="block text-xs text-slate-300">{result.causeOfDeath || `${result.completedDays} days completed`}</span></td>
                <td className="px-3 py-3">{result.score}<span className="block text-xs text-slate-300">{result.scoreLabel}</span></td>
                <td className="px-3 py-3">{result.resourcesCollected}<span className="block text-xs text-slate-300">{result.species === SpeciesType.HOVERFLY ? 'resource units' : 'mg pollen-equivalent'}</span></td>
                <td className="px-3 py-3"><button type="button" onClick={() => onReplay({ ...result.config }, result.species)} className="whitespace-nowrap rounded-lg border border-slate-500 px-3 py-2 hover:bg-slate-800" aria-label={`Repeat ${result.species}, ${result.config.treatment === 'control' ? 'control' : 'treatment'}, seed ${result.config.seed}`}>Repeat setup</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-amber-100">Interpret: did the condition change the resources gathered or reproductive output? Could the difference reflect your strategy or the model's assumptions?</p>
        </> : <p className="text-sm text-slate-300">No saved runs match these filters.</p>}
      </>}
    </section>
  );
};
