import React from 'react';
import { SpeciesStats, SpeciesType } from '../types';
import { Battery, Zap, Target, Skull } from 'lucide-react';
import { BeeIcon } from './BeeIcon';
import { FlyIcon } from './FlyIcon';

interface Props {
  species: SpeciesStats;
  onSelect: (s: SpeciesStats) => void;
}

export const SpeciesCard: React.FC<Props> = ({ species, onSelect }) => {
  return (
    <button 
      onClick={() => onSelect(species)}
      className="flex flex-col items-start bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-amber-400 transition-all p-6 rounded-xl w-full md:w-80 text-left group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-2xl font-bold text-slate-100 group-hover:text-amber-400">{species.name}</h3>
        <div className="text-slate-400 group-hover:text-amber-400">
             {species.name === SpeciesType.HOVERFLY ? <FlyIcon size={32} /> : <BeeIcon size={32} />}
        </div>
      </div>
      
      <p className="text-slate-400 text-sm mb-6 min-h-16">{species.description}</p>
      
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300"><Battery className="w-4 h-4" /> Max Energy</span>
          <span className="font-mono text-amber-200">{species.maxEnergy}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300"><Zap className="w-4 h-4" /> Flight Cost / Hex</span>
          <span className="font-mono text-amber-200">{species.energyCostMove}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300"><Target className="w-4 h-4" /> Range</span>
          <span className="font-mono text-amber-200">{species.flightRange} hexes</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300"><Skull className="w-4 h-4" /> Toxicity Limit</span>
          <span className="font-mono text-amber-200">{species.maxToxicity}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {species.traits.map(trait => (
          <span key={trait} className="px-2 py-1 bg-slate-900 text-xs rounded border border-slate-700 text-slate-300">
            {trait}
          </span>
        ))}
      </div>
    </button>
  );
};
