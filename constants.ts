import { SpeciesStats, SpeciesType, TerrainType, Weather } from './types';

export const HEX_SIZE = 30;
export const MAP_RADIUS = 6;
export const MAX_DAYS = 15;
export const START_ENERGY = 100;
export const MODEL_VERSION = '3.4';
// Energy is a simple activity budget: feeding helps a little; rest restores stamina.
export const ENERGY_PER_RESOURCE = 0.5;
export const CROP_ENERGY_BONUS = 5;
export const SHELTER_REST_RECOVERY = 30;
export const OPEN_REST_RECOVERY = 15;
// Simple gameplay conversion and habitat bonus; not measured physiological rates.
export const HOVERFLY_RESOURCES_PER_EGG = 3;
export const HOVERFLY_APHID_BONUS_MULTIPLIER = 1.5;
export const RESOURCE_REGEN_DAYS = 3;

export const SPECIES_DATA: Record<SpeciesType, SpeciesStats> = {
  [SpeciesType.BUMBLEBEE]: {
    name: SpeciesType.BUMBLEBEE,
    description: "Gather pollen to support new workers. Harvest more per visit, but leave enough energy for the flight home.",
    maxEnergy: 150,
    energyCostMove: 10,
    energyCostForage: 5,
    forageEfficiency: 1.5,
    pesticideResilience: 0.4,
    maxToxicity: 100,
    flightRange: 3,
    traits: ["Colony Growth", "Efficient Foraging", "Costly Flight"]
  },
  [SpeciesType.SOLITARY_BEE]: {
    name: SpeciesType.SOLITARY_BEE,
    description: "Gather pollen to support offspring in nest cells. A short flight range makes nearby flowers valuable.",
    maxEnergy: 80,
    energyCostMove: 5,
    energyCostForage: 3,
    forageEfficiency: 1.2,
    pesticideResilience: 0.2,
    maxToxicity: 60,
    flightRange: 2,
    traits: ["Nest Cells", "Lower Flight Cost", "Short Range"]
  },
  [SpeciesType.HOVERFLY]: {
    name: SpeciesType.HOVERFLY,
    description: "Gather floral resources to support egg production. Flowers near aphids give an automatic reproductive bonus.",
    maxEnergy: 100,
    energyCostMove: 4,
    energyCostForage: 4,
    forageEfficiency: 0.8,
    pesticideResilience: 0.75, // Illustrative exposure modifier, not a general taxonomic prediction
    maxToxicity: 30,
    flightRange: 4,
    traits: ["Floral Resources", "Nearby Aphid Bonus", "Local Shelter"]
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
  [Weather.RAINY]: { moveCostMult: 1.5, resourceMult: 0.6, desc: 'Flight costs 50% more; flowers yield 60% of their usual resources.' },
  [Weather.CLOUDY]: { moveCostMult: 1.2, resourceMult: 0.8, desc: 'Slightly higher flight costs and lower yield.' }
};

// Research-informed reference quantities, rounded for the fictionalised game.
// Species-specific allocation scales calibrate fictional colony/individual output.
// These pollen-equivalents are not measured field loads and never affect food energy.
export const BUMBLEBEE_POLLEN_MG_PER_UNIT = 18;
export const SOLITARY_POLLEN_MG_PER_UNIT = 1.5;
export const BUMBLEBEE_POLLEN_PER_WORKER_MG = 60;
export const SOLITARY_POLLEN_PER_CELL_MG = 65;
export const REPRESENTATIVE_SPECIES: Record<SpeciesType, string> = {
  [SpeciesType.BUMBLEBEE]: 'Bombus terrestris',
  [SpeciesType.SOLITARY_BEE]: 'Osmia bicornis',
  [SpeciesType.HOVERFLY]: 'Episyrphus balteatus',
};
