import React from 'react';
import { RunConfig, ScenarioId, Treatment } from '../types';
import { SCENARIOS } from '../game/scenarios';

interface Props { config: RunConfig; onChange: (config: RunConfig) => void; onNewSeed: () => void }
export const ScenarioSetup: React.FC<Props> = ({ config, onChange, onNewSeed }) => {
  const scenario = SCENARIOS[config.scenarioId];
  return <section className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-950/50 p-5 sm:p-6 text-left" aria-labelledby="setup-heading">
    <h2 id="setup-heading" className="text-xl font-bold text-amber-200 mb-4">1. Set up your experiment</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm text-slate-200">Teaching scenario
        <select value={config.scenarioId} onChange={event => onChange({ ...config, scenarioId: event.target.value as ScenarioId })} className="block w-full rounded-lg border border-slate-500 bg-slate-800 p-3 mt-1">
          {Object.values(SCENARIOS).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <label className="min-w-0 text-sm text-slate-200">Condition
        <select value={config.treatment} onChange={event => onChange({ ...config, treatment: event.target.value as Treatment })} className="block w-full rounded-lg border border-slate-500 bg-slate-800 p-3 mt-1">
          <option value="control">Control · {scenario.controlLabel}</option><option value="intervention">Treatment · {scenario.interventionLabel}</option>
        </select>
      </label>
      <label className="min-w-0 text-sm text-slate-200">Landscape seed
        <input value={config.seed} maxLength={64} onChange={event => onChange({ ...config, seed: event.target.value })} onBlur={() => onChange({ ...config, seed: config.seed.trim() || 'hau-ecology-01' })} className="block w-full rounded-lg border border-slate-500 bg-slate-800 p-3 mt-1 font-mono" aria-describedby="seed-help" />
      </label>
      <div className="flex items-end">
        <button type="button" onClick={onNewSeed} className="w-full rounded-lg border border-slate-500 hover:bg-slate-800 p-3 text-sm">New seed</button>
      </div>
    </div>
    <p id="seed-help" className="text-xs text-slate-300 mt-3">Use the same seed for your control and treatment comparison. A new seed gives a different landscape and weather sequence.</p>
    <div className="mt-4 border-l-2 border-amber-400 pl-4 space-y-2 text-sm">
      <p className="font-semibold text-slate-100">Predict: {scenario.question}</p>
      <p className="text-slate-300">{scenario.predictionPrompt}</p>
      <p className="text-slate-300">{scenario.description}</p>
      <p className="text-amber-100">What changes: {scenario.changedFactor}</p>
    </div>
  </section>;
};
