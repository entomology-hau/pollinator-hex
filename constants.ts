import { SpeciesStats, SpeciesType, TerrainType, Weather } from './types';

export const HEX_SIZE = 30;
export const MAP_RADIUS = 6;
export const MAX_DAYS = 15;
export const START_ENERGY = 100;
export const MODEL_VERSION = '2.0';
export const ENERGY_PER_RESOURCE = 4;
export const FLORAL_RESERVE_CAPACITY = 30;
export const OVIPOSITION_RESOURCE_COST = 6;
export const OVIPOSITION_ENERGY_COST = 4;
export const RESOURCE_REGEN_DAYS = 3;

export const SPECIES_DATA: Record<SpeciesType, SpeciesStats> = {
  [SpeciesType.BUMBLEBEE]: {
    name: SpeciesType.BUMBLEBEE,
    description: "Bring pollen back to the colony. Carry larger loads, but budget for more costly flight and daily food needs.",
    maxEnergy: 150,
    energyCostMove: 10,
    energyCostForage: 5,
    forageEfficiency: 1.5,
    pesticideResilience: 0.4,
    maxToxicity: 100,
    flightRange: 3,
    carryingCapacity: 30,
    dailyMaintenance: 12,
    traits: ["Colony Provisioning", "Larger Pollen Loads", "Costly Flight"]
  },
  [SpeciesType.SOLITARY_BEE]: {
    name: SpeciesType.SOLITARY_BEE,
    description: "Provision individual nest cells. Smaller loads and a short flight range make nearby flowers valuable.",
    maxEnergy: 80,
    energyCostMove: 5,
    energyCostForage: 3,
    forageEfficiency: 1.2,
    pesticideResilience: 0.2,
    maxToxicity: 60,
    flightRange: 2,
    carryingCapacity: 15,
    dailyMaintenance: 8,
    traits: ["Nest Cells", "Smaller Pollen Loads", "Short Range"]
  },
  [SpeciesType.HOVERFLY]: {
    name: SpeciesType.HOVERFLY,
    description: "Feed on flowers, then lay eggs near aphids. Find local shelter without returning to a central nest.",
    maxEnergy: 100,
    energyCostMove: 4,
    energyCostForage: 4,
    forageEfficiency: 0.8,
    pesticideResilience: 0.75, // Illustrative exposure modifier, not a general taxonomic prediction
    maxToxicity: 30,
    flightRange: 4,
    carryingCapacity: 0,
    dailyMaintenance: 8,
    traits: ["Flowers + Aphid Patches", "Egg Laying", "Local Shelter"]
  }
};

export const TERRAIN_CONFIG: Record<TerrainType, { color: string, label: string, risk: string, resources: string }> = {
  [TerrainType.MEADOW]: { color: '#a3e635', label: 'Wildflower Meadow', risk: 'Low', resources: 'Quality-dependent' },
  [TerrainType.FOREST]: { color: '#166534', label: 'Woodland', risk: 'Low', resources: 'Quality-dependent' },
  [TerrainType.CROP]: { color: '#eab308', label: 'Mass Flowering Crop', risk: 'Depends on management', resources: 'Flowering crop' },
  [TerrainType.URBAN]: { color: '#64748b', label: 'Urban Gardens', risk: 'Depends on management', resources: 'Variable' },
  [TerrainType.WATER]: { color: '#3b82f6', label: 'Water Body', risk: 'Flight cost only', resources: 'None' },
  [TerrainType.ROAD]: { color: '#94a3b8', label: 'Paved Road', risk: 'Medium (Collision)', resources: 'None' },
  [TerrainType.NEST]: { color: '#78350f', label: 'Nest / Shelter', risk: 'None', resources: 'No floral resources' }
};

export const WEATHER_EFFECTS: Record<Weather, { moveCostMult: number, resourceMult: number, desc: string }> = {
  [Weather.SUNNY]: { moveCostMult: 1, resourceMult: 1, desc: 'Ideal conditions.' },
  [Weather.RAINY]: { moveCostMult: 2, resourceMult: 0.2, desc: 'Higher flight costs, lower resource yield.' },
  [Weather.CLOUDY]: { moveCostMult: 1.2, resourceMult: 0.8, desc: 'Slightly higher flight costs and lower yield.' }
};

// Research-informed reference quantities, rounded for the fictionalised game.
// Bee resource units are standardised pollen-equivalents, not measured field loads.
export const POLLEN_MG_PER_UNIT = 1;
export const BUMBLEBEE_POLLEN_PER_WORKER_MG = 60;
export const SOLITARY_POLLEN_PER_CELL_MG = 65;
export const EGGS_PER_OVIPOSITION = 10;
export const MAX_EGGS_PER_DAY = 100;
export const REPRESENTATIVE_SPECIES: Record<SpeciesType, string> = {
  [SpeciesType.BUMBLEBEE]: 'Bombus terrestris',
  [SpeciesType.SOLITARY_BEE]: 'Osmia bicornis',
  [SpeciesType.HOVERFLY]: 'Episyrphus balteatus',
};
