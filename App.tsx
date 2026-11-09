import React, { useEffect, useRef, useState } from 'react';
import { SpeciesStats, SpeciesType } from './types';
import { SPECIES_DATA, MAX_DAYS } from './constants';
import { SpeciesCard } from './components/SpeciesCard';
import { HexGrid } from './components/HexGrid';
import { HUD } from './components/HUD';
import { EventLog } from './components/EventLog';
import { TutorialModal } from './components/TutorialModal';
import { createInitialState, startGame, move, forage, endDay } from './game/rules';
import { RotateCcw, ShieldAlert, Trophy, BookOpen } from 'lucide-react';

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameState, setGameState] = useState(createInitialState);
  const screenTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    screenTitle.current?.focus();
  }, [gameState.status]);

  const handleStart = (species: SpeciesStats) => setGameState(startGame(species));
  const handleMove = (q: number, r: number) => {
    if (!showTutorial) setGameState(previous => move(previous, q, r));
  };
  const handleForage = () => {
    if (!showTutorial) setGameState(previous => forage(previous));
  };
  const handleRest = () => {
    if (!showTutorial) setGameState(previous => endDay(previous));
  };
  const handleExit = () => {
    if (!showTutorial && window.confirm('Leave this simulation? Your current progress will be lost.')) {
      setGameState(createInitialState());
    }
  };

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      {gameState.status === 'MENU' ? (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:p-8 bg-slate-900 text-center">
          <h1 ref={screenTitle} tabIndex={-1} className="text-4xl sm:text-5xl font-bold text-amber-400 mb-4">Pollinator Hex</h1>
          <p className="text-slate-300 max-w-xl mb-4 text-lg">Choose your pollinator. Explore the landscape and balance the costs of foraging with the resources you collect.</p>
          <p className="text-sm text-slate-400 max-w-xl mb-6">A {MAX_DAYS}-day teaching game with simplified ecological rules. Survival and resource collection are separate outcomes.</p>
          <button onClick={() => setShowTutorial(true)} className="mb-8 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-500 text-slate-100 px-6 py-3 rounded-full">
            <BookOpen className="w-5 h-5" aria-hidden="true" /> How to Play / Field Guide
          </button>
          <div className="flex flex-wrap gap-6 justify-center w-full max-w-6xl">
            {Object.values(SPECIES_DATA).map(species => <SpeciesCard key={species.name} species={species} onSelect={handleStart} />)}
          </div>
          <p className="mt-6 text-sm text-slate-400 max-w-xl">Select a card to begin. You can play with a mouse, touch, or the keyboard. The field guide explains the controls and model assumptions.</p>
        </main>
      ) : gameState.status === 'GAME_OVER' ? (() => {
        const species = gameState.species!;
        const isHoverfly = species.name === SpeciesType.HOVERFLY;
        const score = isHoverfly ? Math.floor(gameState.player.pollen / 3) : species.name === SpeciesType.SOLITARY_BEE ? Math.floor(gameState.player.pollen / 15) : Math.floor(gameState.player.pollen * 0.6);
        const conversion = isHoverfly ? 'collected resource units ÷ 3, rounded down' : species.name === SpeciesType.SOLITARY_BEE ? 'collected resource units ÷ 15, rounded down' : 'collected resource units × 0.6, rounded down';
        const toxicityRatio = gameState.player.toxicity / species.maxToxicity;
        return (
          <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-950">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-8 text-center">
              {gameState.player.isAlive ? <Trophy className="w-14 h-14 mx-auto text-amber-400 mb-4" aria-hidden="true" /> : <ShieldAlert className="w-14 h-14 mx-auto text-red-400 mb-4" aria-hidden="true" />}
              <h1 ref={screenTitle} tabIndex={-1} className="text-3xl font-bold mb-2">{gameState.player.isAlive ? 'Season complete' : 'Simulation ended'}</h1>
              <p className="text-slate-300 mb-2">{gameState.player.deathReason ? `Cause of death: ${gameState.player.deathReason}` : `You survived all ${MAX_DAYS} days.`}</p>
              <p className="text-amber-200 mb-6">{species.name}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800 p-4 rounded-lg"><dt className="text-slate-300 text-sm">Day reached</dt><dd className="text-2xl font-mono text-amber-300">{gameState.day}</dd></div>
                <div className="bg-slate-800 p-4 rounded-lg"><dt className="text-slate-300 text-sm">Toxicity load</dt><dd className={`text-2xl font-mono ${toxicityRatio >= 1 ? 'text-red-300' : toxicityRatio > 0.5 ? 'text-amber-300' : 'text-emerald-300'}`}>{gameState.player.toxicity.toFixed(1)} / {species.maxToxicity}</dd></div>
                <div className="bg-slate-800 p-4 rounded-lg"><dt className="text-slate-300 text-sm">{isHoverfly ? 'Floral resource units' : 'Pollen units'} collected</dt><dd className="text-2xl font-mono text-pink-300">{gameState.player.pollen}</dd></div>
              </dl>
              <section className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-5 mb-6" aria-labelledby="score-heading">
                <h2 id="score-heading" className="text-lg font-semibold text-emerald-200">Illustrative reproductive score</h2>
                <p className="text-5xl font-bold my-3">{score} <span className="text-base font-normal">points</span></p>
                <p className="text-sm text-slate-300">Game calculation: {conversion}.</p>
                <p className="text-sm text-slate-300 mt-2">This is a resource-based teaching score, not a prediction of workers, eggs or surviving offspring. Compare scores within the same pollinator type.</p>
                {gameState.player.pollen === 0 && <p className="mt-3 text-amber-200">No resources were collected. Surviving alone does not earn reproductive points.</p>}
              </section>
              <p className="text-sm text-slate-300 mb-5">Record the pollinator, day reached, resources and score for your practical worksheet. Which choices affected your result?</p>
              <EventLog logs={gameState.player.history} />
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button onClick={() => setShowTutorial(true)} className="px-4 py-3 rounded-lg border border-slate-500 hover:bg-slate-800">Model assumptions / Help</button>
                <button onClick={() => setGameState(createInitialState())} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-6 rounded-lg flex items-center gap-2"><RotateCcw className="w-5 h-5" aria-hidden="true" /> New simulation</button>
              </div>
            </div>
          </main>
        );
      })() : (
        <main className="min-h-screen bg-slate-950 p-3 sm:p-5">
          <header className="max-w-[1440px] mx-auto mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h1 ref={screenTitle} tabIndex={-1} className="text-2xl font-bold text-amber-300">Pollinator Hex</h1>
            <p className="text-sm text-slate-300">Explore, collect resources and review your decisions.</p>
          </header>
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <section aria-label="Landscape and movement" className="min-w-0 bg-slate-900/40 border border-slate-800 rounded-xl p-2 sm:p-4">
              <HexGrid gameState={gameState} onHexClick={handleMove} />
            </section>
            <aside aria-label="Pollinator status and actions" className="min-w-0 space-y-4">
              <HUD gameState={gameState} currentHex={gameState.map.get(`${gameState.player.q},${gameState.player.r}`)} onForage={handleForage} onRest={handleRest} onOpenHelp={() => setShowTutorial(true)} onExit={handleExit} />
              <EventLog logs={gameState.player.history} />
            </aside>
          </div>
        </main>
      )}
    </>
  );
}
