import React, { useEffect, useRef, useState } from 'react';
import { RunConfig, SpeciesStats, SpeciesType } from './types';
import { SPECIES_DATA, MAX_DAYS, REPRESENTATIVE_SPECIES, BUMBLEBEE_POLLEN_PER_WORKER_MG, SOLITARY_POLLEN_PER_CELL_MG, EGGS_PER_OVIPOSITION } from './constants';
import { SpeciesCard } from './components/SpeciesCard';
import { ScenarioSetup } from './components/ScenarioSetup';
import { TrialHistory } from './components/TrialHistory';
import { HexGrid } from './components/HexGrid';
import { HUD } from './components/HUD';
import { EventLog } from './components/EventLog';
import { TutorialModal } from './components/TutorialModal';
import { createInitialState, startGame, move, forage, endDay, oviposit, getReproductiveScore } from './game/rules';
import { DEFAULT_CONFIG, normaliseConfig, SCENARIOS } from './game/scenarios';
import { createTrialResult, loadTrials, saveTrials, resultsToCsv, eventsToCsv, MAX_SAVED_TRIALS } from './game/trials';
import { RotateCcw, ShieldAlert, Trophy, BookOpen } from 'lucide-react';

const newSeed = () => `hau-${crypto.randomUUID().slice(0, 8)}`;
const downloadCsv = (content: string, name: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameState, setGameState] = useState(createInitialState);
  const [loaded] = useState(loadTrials);
  const [config, setConfig] = useState<RunConfig>(() => ({ ...DEFAULT_CONFIG, trial: Math.min(999999, Math.max(0, ...loaded.results.map(result => result.config.trial)) + 1) }));
  const [trials, setTrials] = useState(loaded.results);
  const [storageError, setStorageError] = useState(loaded.error);
  const [storageBlocked, setStorageBlocked] = useState(Boolean(loaded.error));
  const [savedCurrentRun, setSavedCurrentRun] = useState(false);
  const recordedState = useRef<typeof gameState | null>(null);
  const screenTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => { screenTitle.current?.focus(); }, [gameState.status]);
  useEffect(() => {
    if (gameState.status !== 'GAME_OVER' || recordedState.current === gameState) return;
    recordedState.current = gameState;
    const result = createTrialResult(gameState);
    const next = [...trials, result].slice(-MAX_SAVED_TRIALS);
    setTrials(next); setSavedCurrentRun(true);
    if (!storageBlocked) setStorageError(saveTrials(next).error);
  }, [gameState, trials, storageBlocked]);

  const nextTrial = () => Math.min(999999, Math.max(config.trial, ...trials.map(result => result.config.trial), 0) + 1);
  const handleStart = (species: SpeciesStats, selected = config) => {
    const normalised = normaliseConfig(selected);
    setConfig(normalised); setSavedCurrentRun(false); recordedState.current = null;
    setGameState(startGame(species, normalised));
  };
  const handleMove = (q: number, r: number) => { if (!showTutorial) setGameState(previous => move(previous, q, r)); };
  const handleForage = () => { if (!showTutorial) setGameState(forage); };
  const handleRest = () => { if (!showTutorial) setGameState(endDay); };
  const handleOviposit = () => { if (!showTutorial) setGameState(oviposit); };
  const setup = (seed = config.seed) => { setConfig(previous => ({ ...previous, seed, trial: nextTrial() })); setGameState(createInitialState()); };
  const handleExit = () => {
    if (!showTutorial && window.confirm('Leave this unfinished trial? It will not be added to your completed trial history.')) setup();
  };
  const clearTrials = () => {
    if (window.confirm('Clear saved trial history in this browser? Export your results first if you need to keep them.')) {
      setTrials([]); setStorageBlocked(false); setStorageError(saveTrials([]).error);
    }
  };
  const history = <TrialHistory results={trials} onReplay={(previous, species) => handleStart(SPECIES_DATA[species], { ...previous, trial: nextTrial() })} onExportSummary={() => downloadCsv(resultsToCsv(trials), 'pollinator-trial-results.csv')} onExportEvents={() => downloadCsv(eventsToCsv(trials), 'pollinator-action-history.csv')} onClear={clearTrials} />;
  const storageNotice = storageError && <p role="alert" className="w-full max-w-6xl rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-100">{storageError} New results remain available for export in this session.{storageBlocked && <button className="ml-2 underline" onClick={clearTrials}>Reset saved history</button>}</p>;

  return <>
    <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    {gameState.status === 'MENU' ? (
      <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:p-8 bg-slate-900 text-center gap-6">
        <header className="max-w-3xl">
          <h1 ref={screenTitle} tabIndex={-1} className="text-4xl sm:text-5xl font-bold text-amber-400 mb-4">Pollinator Hex</h1>
          <p className="text-slate-200 text-lg">Gather food. Provision your nest or find aphids for your offspring. Discover how a changing landscape shapes reproductive success.</p>
          <p className="text-sm text-slate-300 mt-3">A {MAX_DAYS}-day season with three pollinators and repeatable classroom experiments.</p>
        </header>
        <button onClick={() => setShowTutorial(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-500 text-slate-100 px-6 py-3 rounded-full"><BookOpen className="w-5 h-5" aria-hidden="true" />How to Play / Field Guide</button>
        <ScenarioSetup config={config} onChange={setConfig} onNewSeed={() => setConfig(previous => ({ ...previous, seed: newSeed(), trial: nextTrial() }))} />
        <section className="w-full max-w-6xl" aria-labelledby="species-heading">
          <h2 id="species-heading" className="text-xl font-bold text-amber-200 mb-4">2. Choose a pollinator to begin</h2>
          <div className="flex flex-wrap gap-6 justify-center">{Object.values(SPECIES_DATA).map(species => <SpeciesCard key={species.name} species={species} onSelect={handleStart} />)}</div>
          <p className="text-sm text-slate-300 mt-4">Keep your strategy comparable when you test the paired condition. Use the mouse, touch or keyboard to play.</p>
        </section>
        {storageNotice}
        <div className="w-full max-w-6xl">{history}</div>
      </main>
    ) : gameState.status === 'GAME_OVER' ? (() => {
      const species = gameState.species!;
      const isHoverfly = species.name === SpeciesType.HOVERFLY;
      const output = getReproductiveScore(gameState);
      const scenario = SCENARIOS[gameState.config.scenarioId];
      return <main className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col items-center gap-6">
        <section className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-8 text-center">
          {gameState.player.isAlive ? <Trophy className="w-12 h-12 mx-auto text-amber-400 mb-3" aria-hidden="true" /> : <ShieldAlert className="w-12 h-12 mx-auto text-red-400 mb-3" aria-hidden="true" />}
          <h1 ref={screenTitle} tabIndex={-1} className="text-3xl font-bold mb-2">{gameState.player.isAlive ? 'Season complete' : 'Your foraging season has ended'}</h1>
          <p className="text-slate-300">{gameState.player.deathReason ? `Cause of death: ${gameState.player.deathReason}` : `You survived all ${MAX_DAYS} days.`}</p>
          <p className="text-amber-200 mt-2">{species.name} · <i>{REPRESENTATIVE_SPECIES[species.name]}</i></p>
          <p className="text-sm text-slate-300 my-4 break-words">Trial {gameState.config.trial} · {scenario.title} · {gameState.config.treatment === 'control' ? scenario.controlLabel : scenario.interventionLabel} · Seed {gameState.config.seed}</p>
          <section className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-5 mb-5" aria-labelledby="output-heading">
            <h2 id="output-heading" className="text-lg font-semibold text-emerald-200">Reproductive output</h2>
            <p className="text-6xl font-bold my-3">{output.score}</p>
            <p className="text-xl text-emerald-100">{output.label}</p>
            <p className="text-sm text-slate-300 mt-3">{isHoverfly ? `${gameState.player.ovipositionBatches} oviposition ${gameState.player.ovipositionBatches === 1 ? 'bout' : 'bouts'} × ${EGGS_PER_OVIPOSITION} eggs.` : `${gameState.player.deliveredPollen} mg pollen-equivalent delivered; ${species.name === SpeciesType.BUMBLEBEE ? BUMBLEBEE_POLLEN_PER_WORKER_MG : SOLITARY_POLLEN_PER_CELL_MG} mg per ${species.name === SpeciesType.BUMBLEBEE ? 'worker supported' : 'nest cell'}.`}</p>
            <p className="text-xs text-slate-300 mt-2">Fictionalised outcomes using research-informed quantities. {isHoverfly ? 'Egg counts represent reproductive investment; larval survival is not simulated.' : 'Bee outputs describe brood provision support, not adults emerging within these 15 days.'}</p>
          </section>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-sm">
            {[
              ['Days completed', gameState.metrics.completedDays], ['Day reached', gameState.day], ['Distance (hexes)', gameState.metrics.distance],
              [isHoverfly ? 'Floral reserve left' : 'Pollen still carried (mg equiv.)', isHoverfly ? gameState.player.floralReserve : gameState.player.carriedPollen],
              ['Energy left', gameState.player.energy.toFixed(1)], ['Toxicity / limit', `${gameState.player.toxicity.toFixed(1)} / ${species.maxToxicity}`], ['Foraging visits', gameState.metrics.forageVisits], ['Exposure events', gameState.metrics.exposureEvents],
            ].map(([label, value]) => <div key={label} className="bg-slate-800 p-3 rounded-lg"><dt className="text-slate-300">{label}</dt><dd className="font-mono text-xl mt-1 text-amber-200">{value}</dd></div>)}
          </dl>
          {!isHoverfly && gameState.player.carriedPollen > 0 && <p className="text-sm text-slate-300 mb-4">Undelivered pollen does not count towards brood provisioning.</p>}
          <p className="text-sm text-amber-100 mb-4">Interpret: {scenario.question} Which differences reflect your choices, and which reflect the landscape?</p>
          <EventLog logs={gameState.player.history} />
          <p role="status" className="text-xs text-slate-300 mt-4">{savedCurrentRun ? 'This finished trial has been added to the history below.' : 'Recording this trial…'}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <button onClick={() => handleStart(species, { ...gameState.config, trial: nextTrial() })} className="rounded-lg border border-slate-500 px-4 py-3 hover:bg-slate-800 flex items-center gap-2"><RotateCcw className="w-4 h-4" aria-hidden="true" />Repeat same condition</button>
            <button onClick={() => handleStart(species, { ...gameState.config, treatment: gameState.config.treatment === 'control' ? 'intervention' : 'control', trial: nextTrial() })} className="rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-300">Try paired condition</button>
            <button onClick={() => setup()} className="rounded-lg border border-slate-500 px-4 py-3 hover:bg-slate-800">Change pollinator / setup</button>
            <button onClick={() => setup(newSeed())} className="rounded-lg border border-slate-500 px-4 py-3 hover:bg-slate-800">New seed & setup</button>
            <button onClick={() => setShowTutorial(true)} className="rounded-lg border border-slate-500 px-4 py-3 hover:bg-slate-800">Field guide</button>
          </div>
        </section>
        {storageNotice}<div className="w-full max-w-6xl">{history}</div>
      </main>;
    })() : (
      <main className="min-h-screen bg-slate-950 p-3 sm:p-5">
        <header className="max-w-[1440px] mx-auto mb-4 space-y-2">
          <h1 ref={screenTitle} tabIndex={-1} className="text-2xl font-bold text-amber-300">Pollinator Hex</h1>
          <p className="text-sm text-slate-200 break-words">Trial {gameState.config.trial} · {SCENARIOS[gameState.config.scenarioId].title} · {gameState.config.treatment === 'control' ? SCENARIOS[gameState.config.scenarioId].controlLabel : SCENARIOS[gameState.config.scenarioId].interventionLabel} · Seed <span className="font-mono">{gameState.config.seed}</span></p>
        </header>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          <section aria-label="Landscape and movement" className="min-w-0"><HexGrid gameState={gameState} onHexClick={handleMove} />
            <p className="rounded-lg border border-slate-700 bg-slate-900 p-4 mt-3 text-sm text-slate-300">Your experiment: {SCENARIOS[gameState.config.scenarioId].question}</p>
          </section>
          <aside aria-label="Pollinator status and actions" className="min-w-0 space-y-4">
            <HUD gameState={gameState} currentHex={gameState.map.get(`${gameState.player.q},${gameState.player.r}`)} onForage={handleForage} onRest={handleRest} onOviposit={handleOviposit} onOpenHelp={() => setShowTutorial(true)} onExit={handleExit} />
            <EventLog logs={gameState.player.history} />
          </aside>
        </div>
      </main>
    )}
  </>;
}
