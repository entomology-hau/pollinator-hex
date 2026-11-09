import React from 'react';
import { GameState, HexCell, TerrainType, SpeciesType } from '../types';
import { MAX_DAYS, WEATHER_EFFECTS, TERRAIN_CONFIG } from '../constants';
import { getForageBlockReason } from '../game/rules';
import { Battery, CloudRain, Sun, Cloud, Flower, Skull, HelpCircle, LogOut } from 'lucide-react';

interface Props {
  gameState: GameState;
  currentHex: HexCell | undefined;
  onForage: () => void;
  onRest: () => void;
  onOpenHelp: () => void;
  onExit: () => void;
}

export const HUD: React.FC<Props> = ({ gameState, currentHex, onForage, onRest, onOpenHelp, onExit }) => {
  if (!gameState.species || !currentHex) return null;
  const { player, weather, day, species } = gameState;
  const WeatherIcon = { SUNNY: Sun, RAINY: CloudRain, CLOUDY: Cloud }[weather];
  const terrain = TERRAIN_CONFIG[currentHex.type];
  const blockedReason = getForageBlockReason(gameState);
  const atNest = currentHex.type === TerrainType.NEST;
  const hasFlowers = ![TerrainType.NEST, TerrainType.WATER, TerrainType.ROAD].includes(currentHex.type);
  const isHoverfly = species.name === SpeciesType.HOVERFLY;
  const impaired = player.toxicity > species.maxToxicity * 0.5;
  const latest = player.history[player.history.length - 1];
  return (
    <>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-labelledby="status-title">
        <h2 id="status-title" className="font-bold text-xl text-amber-300 mb-4">{species.name}</h2>
        <dl className="space-y-3">
          <div><div className="flex justify-between gap-3 mb-1"><dt className="flex gap-2 items-center text-sm"><Battery className="w-4 h-4 text-emerald-300" aria-hidden="true" />Energy</dt><dd className="font-mono text-sm">{player.energy.toFixed(1)} / {species.maxEnergy}</dd></div><progress aria-label="Energy" value={player.energy} max={species.maxEnergy} className="w-full h-2 accent-emerald-400" /></div>
          <div><div className="flex justify-between gap-3 mb-1"><dt className="flex gap-2 items-center text-sm"><Skull className="w-4 h-4 text-purple-300" aria-hidden="true" />Toxicity</dt><dd className="font-mono text-sm">{player.toxicity.toFixed(1)} / {species.maxToxicity}</dd></div><progress aria-label="Toxicity" value={player.toxicity} max={species.maxToxicity} className="w-full h-2 accent-purple-400" /></div>
          <div className="flex justify-between gap-3 border-t border-slate-700 pt-3"><dt className="text-sm">{isHoverfly ? 'Floral resources' : 'Pollen'} collected</dt><dd className="font-mono font-bold text-pink-300">{player.pollen}</dd></div>
        </dl>
        {impaired && <p className="text-amber-200 text-sm mt-3">Impaired: flight costs 50% more; foraging yield is reduced by 25%.</p>}
      </section>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-label="Day and weather">
        <p className="text-sm text-slate-300 mb-2">Day {day} / {MAX_DAYS}</p>
        <div className="flex items-center gap-2 font-semibold"><WeatherIcon className="w-6 h-6 text-amber-300" aria-hidden="true" />{weather.charAt(0) + weather.slice(1).toLowerCase()}</div>
        <p className="text-sm text-slate-300 mt-2">{WEATHER_EFFECTS[weather].desc}</p>
      </section>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-labelledby="current-tile-title">
        <h2 id="current-tile-title" className="font-bold mb-3">{terrain.label} <span className="font-normal text-slate-400">({player.q}, {player.r})</span></h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Risk</dt><dd className="text-right">{terrain.risk}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Resources</dt><dd className="text-right">{terrain.resources}</dd></div>
          {hasFlowers && <div className="flex justify-between gap-3"><dt className="text-slate-300">Resource quality</dt><dd>{currentHex.resourceQuality}%</dd></div>}
          {currentHex.pesticideLevel > 0 && <div className="flex justify-between gap-3"><dt className="text-slate-300">Exposure level</dt><dd>{(currentHex.pesticideLevel * 100).toFixed(0)}%</dd></div>}
        </dl>
        <div className="mt-4 flex flex-col gap-3">
          {!atNest && <button onClick={onForage} disabled={Boolean(blockedReason)} aria-describedby="forage-explanation" className="w-full rounded-lg px-3 py-3 font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:bg-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"><Flower className="w-5 h-5" aria-hidden="true" />{isHoverfly ? 'Feed' : 'Forage'}</button>}
          <p id="forage-explanation" className="text-sm text-slate-300">{blockedReason || `Foraging requires ${species.energyCostForage} energy and may replenish some energy as you feed.`}</p>
          <button onClick={onRest} className="w-full rounded-lg px-3 py-3 font-bold bg-emerald-700 hover:bg-emerald-600 text-white">{atNest ? 'End day at shelter' : 'Rest and end day'}</button>
          <p className="text-xs text-slate-300">{atNest ? 'Rest restores up to 40 energy. No resources are collected by resting.' : 'Rest restores up to 20 energy, with a 15% risk of night-time predation.'}</p>
        </div>
      </section>
      <section className="rounded-xl border border-amber-700/70 bg-amber-950/20 p-4" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading" className="text-sm font-bold text-amber-200 mb-2">Latest action</h2>
        <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-100 min-h-10"><p key={player.history.length}>{latest ? `Day ${latest.day}: ${latest.event}` : 'Choose a destination on the map.'}</p></div>
      </section>
      <div className="flex flex-wrap gap-2">
        <button onClick={onOpenHelp} className="flex-1 min-w-28 flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-500 hover:bg-slate-800 text-sm"><HelpCircle className="w-4 h-4" aria-hidden="true" />Field guide</button>
        <button onClick={onExit} className="flex-1 min-w-28 flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-500 hover:bg-slate-800 text-sm"><LogOut className="w-4 h-4" aria-hidden="true" />Exit</button>
      </div>
    </>
  );
};
