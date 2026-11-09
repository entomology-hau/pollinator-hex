import { SpeciesStats, SpeciesType, TerrainType, Weather } from './types';

export const HEX_SIZE = 30;
export const MAP_RADIUS = 6;
export const MAX_DAYS = 15;
export const START_ENERGY = 100;
export const RESOURCE_REGEN_DAYS = 3;

export const SPECIES_DATA: Record<SpeciesType, SpeciesStats> = {
  [SpeciesType.BUMBLEBEE]: {
    name: SpeciesType.BUMBLEBEE,
    description: "A simplified bumblebee forager: a large energy reserve and high resource yield, with costly flight.",
    maxEnergy: 150,
    energyCostMove: 10,
    energyCostForage: 5,
    forageEfficiency: 1.5,
    pesticideResilience: 0.4,
    maxToxicity: 100,
    flightRange: 3,
    traits: ["Large Energy Reserve", "High Yield", "Costly Flight"]
  },
  [SpeciesType.SOLITARY_BEE]: {
    name: SpeciesType.SOLITARY_BEE,
    description: "A simplified solitary bee forager: lower flight costs and a smaller energy reserve, with a short range per move.",
    maxEnergy: 80,
    energyCostMove: 5,
    energyCostForage: 3,
    forageEfficiency: 1.2,
    pesticideResilience: 0.2,
    maxToxicity: 60,
    flightRange: 2,
    traits: ["Low Flight Cost", "Short Move Range"]
  },
  [SpeciesType.HOVERFLY]: {
    name: SpeciesType.HOVERFLY,
    description: "A simplified adult hoverfly feeding on flowers. Aphid-eating larvae belong to a separate life stage and are not simulated.",
    maxEnergy: 100,
    energyCostMove: 4,
    energyCostForage: 4,
    forageEfficiency: 0.8,
    pesticideResilience: 0.75, // Illustrative exposure modifier, not a general taxonomic prediction
    maxToxicity: 30,
    flightRange: 4,
    traits: ["Adult Floral Feeding", "Low Flight Cost", "Long Move Range"]
  }
};

export const TERRAIN_CONFIG: Record<TerrainType, { color: string, label: string, risk: string, resources: string }> = {
  [TerrainType.MEADOW]: { color: '#a3e635', label: 'Wildflower Meadow', risk: 'Low', resources: 'Quality-dependent' },
  [TerrainType.FOREST]: { color: '#166534', label: 'Woodland', risk: 'Low', resources: 'Quality-dependent' },
  [TerrainType.CROP]: { color: '#eab308', label: 'Mass Flowering Crop', risk: 'High (Pesticides)', resources: 'Abundant (Bonus)' },
  [TerrainType.URBAN]: { color: '#64748b', label: 'Urban Gardens', risk: 'Medium', resources: 'Variable' },
  [TerrainType.WATER]: { color: '#3b82f6', label: 'Water Body', risk: 'Flight cost only', resources: 'None' },
  [TerrainType.ROAD]: { color: '#94a3b8', label: 'Paved Road', risk: 'Medium (Collision)', resources: 'None' },
  [TerrainType.NEST]: { color: '#78350f', label: 'Nest / Shelter', risk: 'None', resources: 'Safe Haven' }
};

export const WEATHER_EFFECTS: Record<Weather, { moveCostMult: number, resourceMult: number, desc: string }> = {
  [Weather.SUNNY]: { moveCostMult: 1, resourceMult: 1, desc: 'Ideal conditions.' },
  [Weather.RAINY]: { moveCostMult: 2, resourceMult: 0.2, desc: 'Higher flight costs, lower resource yield.' },
  [Weather.CLOUDY]: { moveCostMult: 1.2, resourceMult: 0.8, desc: 'Slightly higher flight costs and lower yield.' }
};
