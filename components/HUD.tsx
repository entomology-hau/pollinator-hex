import React from 'react';
import { GameState, HexCell, TerrainType, SpeciesType } from '../types';
import { MAX_DAYS, WEATHER_EFFECTS, TERRAIN_CONFIG, HOVERFLY_APHID_BONUS_MULTIPLIER, RESOURCE_REGEN_DAYS } from '../constants';
import { getReproductiveScore, getResourceQuantity, hasNearbyAphids, isSafeShelter } from '../game/rules';
import { Battery, CloudRain, Sun, Cloud, Flower, Skull, HelpCircle, LogOut } from 'lucide-react';
import { formatEventForDisplay } from './formatEvent';

interface Props {
  gameState: GameState;
  currentHex: HexCell | undefined;
  onOpenHelp: () => void;
  onExit: () => void;
}

export const HUD: React.FC<Props> = ({ gameState, currentHex, onOpenHelp, onExit }) => {
  if (!gameState.species || !currentHex) return null;
  const { player, weather, day, species } = gameState;
  const WeatherIcon = { SUNNY: Sun, RAINY: CloudRain, CLOUDY: Cloud }[weather];
  const terrain = TERRAIN_CONFIG[currentHex.type];
  const terrainLabel = currentHex.flowerStrip ? 'Flower strip' : terrain.label;
  const hasFlowers = currentHex.resourceQuality > 0 && ![TerrainType.NEST, TerrainType.WATER, TerrainType.ROAD].includes(currentHex.type);
  const depleted = currentHex.lastForagedDay !== null && day - currentHex.lastForagedDay < RESOURCE_REGEN_DAYS;
  const isHoverfly = species.name === SpeciesType.HOVERFLY;
  const aphidBonus = isHoverfly && hasFlowers && hasNearbyAphids(gameState);
  const sheltered = isSafeShelter(gameState);
  const output = getReproductiveScore(gameState);
  const impaired = player.toxicity > species.maxToxicity * 0.5;
  const latest = player.history[player.history.length - 1];
  const riskLabel = currentHex.type === TerrainType.ROAD ? 'Road collision risk' : currentHex.pesticideLevel > 0 ? 'Pesticide exposure' : 'No pesticide exposure';
  return (
    <>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-labelledby="status-title">
        <h2 id="status-title" className="font-bold text-xl text-amber-300 mb-4">{species.name}</h2>
        <dl className="space-y-3">
          <div><div className="flex justify-between gap-3 mb-1"><dt className="flex gap-2 items-center text-sm"><Battery className="w-4 h-4 text-emerald-300" aria-hidden="true" />Energy</dt><dd className="font-mono text-sm">{player.energy.toFixed(1)} / {species.maxEnergy}</dd></div><progress aria-label="Energy" value={player.energy} max={species.maxEnergy} className="w-full h-2 accent-emerald-400" /></div>
          <div><div className="flex justify-between gap-3 mb-1"><dt className="flex gap-2 items-center text-sm"><Skull className="w-4 h-4 text-purple-300" aria-hidden="true" />Toxicity</dt><dd className="font-mono text-sm">{player.toxicity.toFixed(1)} / {species.maxToxicity}</dd></div><progress aria-label="Toxicity" value={player.toxicity} max={species.maxToxicity} className="w-full h-2 accent-purple-400" /></div>
          <div className="border-t border-slate-700 pt-3 flex justify-between gap-3">
            <dt className="text-sm flex items-center gap-2"><Flower className="w-4 h-4 text-pink-300" aria-hidden="true" />Resources gathered</dt>
            <dd className="text-right"><span className="font-mono font-semibold text-emerald-200">{getResourceQuantity(species.name, player.pollen).toLocaleString('en-GB', { maximumFractionDigits: 2 })}</span><span className="block text-xs text-slate-300">{isHoverfly ? 'resource units' : 'mg pollen-equivalent'}</span></dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/30 p-3">
          <h3 className="text-xs text-emerald-200 font-semibold uppercase tracking-wide">Reproductive output</h3>
          <p className="mt-1 text-xl font-bold text-white">{output.score} <span className="text-sm font-normal text-emerald-100">{output.label}</span></p>
        </div>
        <p className="text-xs text-slate-300 mt-3">Gathered resources contribute automatically to reproductive output.</p>
        {impaired && <p className="text-amber-200 text-sm mt-3">Impaired: flight costs 50% more; foraging yield is reduced by 25%.</p>}
      </section>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-label="Day and weather">
        <p className="text-sm text-slate-300 mb-2">Day {day} / {MAX_DAYS}</p>
        <div className="flex items-center gap-2 font-semibold"><WeatherIcon className="w-6 h-6 text-amber-300" aria-hidden="true" />{weather.charAt(0) + weather.slice(1).toLowerCase()}</div>
        <p className="text-sm text-slate-300 mt-2">{WEATHER_EFFECTS[weather].desc}</p>
      </section>
      <section className="bg-slate-900 border border-slate-700 p-4 rounded-xl" aria-labelledby="current-tile-title">
        <h2 id="current-tile-title" className="font-bold mb-3">{terrainLabel}</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Hazards</dt><dd className="text-right">{riskLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Flowers</dt><dd className="text-right">{hasFlowers ? depleted ? `Replenish on day ${currentHex.lastForagedDay! + RESOURCE_REGEN_DAYS}` : 'Available' : 'None'}</dd></div>
          {hasFlowers && <div className="flex justify-between gap-3"><dt className="text-slate-300">Full-patch abundance</dt><dd>{currentHex.resourceQuality}%</dd></div>}
          {currentHex.pesticideLevel > 0 && <div className="flex justify-between gap-3"><dt className="text-slate-300">Exposure level</dt><dd>{(currentHex.pesticideLevel * 100).toFixed(0)}%</dd></div>}
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Aphid patch</dt><dd>{currentHex.aphids ? 'Present' : 'Absent'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-300">Night shelter</dt><dd>{sheltered ? 'Safe for this pollinator' : 'Exposed'}</dd></div>
        </dl>
        {aphidBonus && <p className="text-sm text-pink-200 mt-3">Aphid bonus: +{Math.round((HOVERFLY_APHID_BONUS_MULTIPLIER - 1) * 100)}% resource credit. Nearby aphids support future larvae; the bonus adds no food energy.</p>}

      </section>
      <section className="rounded-xl border border-amber-700/70 bg-amber-950/20 p-4" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading" className="text-sm font-bold text-amber-200 mb-2">Latest action</h2>
        <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-100 min-h-10"><p key={player.history.length}>{latest ? `Day ${latest.day}: ${formatEventForDisplay(latest.event)}` : 'Choose a destination on the map.'}</p></div>
      </section>
      <div className="flex flex-wrap gap-2">
        <button onClick={onOpenHelp} className="flex-1 min-w-28 flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-500 hover:bg-slate-800 text-sm"><HelpCircle className="w-4 h-4" aria-hidden="true" />Field guide</button>
        <button onClick={onExit} className="flex-1 min-w-28 flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-500 hover:bg-slate-800 text-sm"><LogOut className="w-4 h-4" aria-hidden="true" />Exit</button>
      </div>
    </>
  );
};
