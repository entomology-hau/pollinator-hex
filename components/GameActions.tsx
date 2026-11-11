import React from 'react';
import { Battery, Flower, Moon } from 'lucide-react';
import { GameState, HexCell, SpeciesType } from '../types';
import { MAX_DAYS, TERRAIN_CONFIG } from '../constants';
import { getForageBlockReason, getForagePreview, getResourceQuantity, getRestPreview } from '../game/rules';

interface Props {
  gameState: GameState;
  currentHex: HexCell | undefined;
  onForage: () => void;
  onRest: () => void;
}

const formatEnergy = (value: number) => value.toFixed(1).replace(/\.0$/, '');

/** One set of actions stays beside the landscape while the map is explored. */
export const GameActions: React.FC<Props> = ({ gameState, currentHex, onForage, onRest }) => {
  const { player, species, day } = gameState;
  if (!species || !currentHex) return null;
  const blockedReason = getForageBlockReason(gameState);
  const forage = getForagePreview(gameState);
  const rest = getRestPreview(gameState);
  if (!rest) return null;
  const terrainLabel = currentHex.flowerStrip ? 'Flower strip' : TERRAIN_CONFIG[currentHex.type].label;
  const energyNote = forage && (forage.energyChange > 0
    ? `Recover ${formatEnergy(forage.energyChange)} energy.`
    : forage.energyChange < 0
      ? `Uses ${formatEnergy(-forage.energyChange)} energy.`
      : player.energy >= species.maxEnergy ? 'Energy already full.' : 'No net energy change.');

  return (
    <section aria-label="Foraging and rest actions" data-game-actions className="sticky top-2 z-20 rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-lg shadow-slate-950/50 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className="font-semibold text-slate-100">Day {day}/{MAX_DAYS} <span className="font-normal text-slate-300">· {terrainLabel}</span></p>
        <p className="flex items-center gap-1.5 font-mono text-emerald-200"><Battery className="h-4 w-4" aria-hidden="true" />Energy {formatEnergy(player.energy)}/{species.maxEnergy}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <button onClick={onForage} disabled={Boolean(blockedReason)} aria-describedby="forage-explanation" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-2 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 sm:text-base"><Flower className="h-5 w-5 shrink-0" aria-hidden="true" />Forage</button>
          <p id="forage-explanation" className="mt-2 text-xs leading-relaxed text-slate-200">{blockedReason || (forage && <>{energyNote} Gather {getResourceQuantity(species.name, forage.creditedResources).toLocaleString('en-GB', { maximumFractionDigits: 2 })} {species.name === SpeciesType.HOVERFLY ? 'resource units' : 'mg pollen-equivalent'}.</>)}</p>
        </div>
        <div className="min-w-0">
          <button onClick={onRest} aria-describedby="rest-explanation" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-2 py-3 text-sm font-bold text-white hover:bg-emerald-600 sm:text-base"><Moon className="h-5 w-5 shrink-0" aria-hidden="true" />Rest &amp; end day</button>
          <p id="rest-explanation" className="mt-2 text-xs leading-relaxed text-slate-200">{rest.energyChange > 0 ? `Recover ${formatEnergy(rest.energyChange)} energy (to ${formatEnergy(rest.energyAfter)}/${species.maxEnergy}).` : 'Energy already full.'} {rest.sheltered ? 'Safe shelter.' : 'In the open: 15% night predation risk.'}</p>
        </div>
      </div>
    </section>
  );
};
