import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Bug, Flower2, Home, Route, Sprout, Trees, Waves } from 'lucide-react';
import { GameState, HexCell, SpeciesType, TerrainType } from '../types';
import { HEX_SIZE, RESOURCE_REGEN_DAYS, TERRAIN_CONFIG } from '../constants';
import { getMovePreview } from '../game/rules';
import { BeeIcon } from './BeeIcon';
import { FlyIcon } from './FlyIcon';

interface Props {
  gameState: GameState;
  onHexClick: (q: number, r: number) => void;
}

const TERRAIN_ICONS = {
  [TerrainType.MEADOW]: Flower2,
  [TerrainType.FOREST]: Trees,
  [TerrainType.CROP]: Sprout,
  [TerrainType.URBAN]: Building2,
  [TerrainType.WATER]: Waves,
  [TerrainType.NEST]: Home,
  [TerrainType.ROAD]: Route,
};

// Flat-topped axial coordinates: W/S are vertical; Q/A and E/D are diagonals.
const KEY_DIRECTIONS: Record<string, [number, number]> = {
  w: [0, -1], ArrowUp: [0, -1],
  s: [0, 1], ArrowDown: [0, 1],
  q: [-1, 0], ArrowLeft: [-1, 0],
  a: [-1, 1],
  e: [1, -1],
  d: [1, 0], ArrowRight: [1, 0],
};

const keyOf = (q: number, r: number) => `${q},${r}`;
const formatEnergy = (value: number) => Number(value.toFixed(1)).toString();
const hasFlowers = (cell: HexCell) => cell.resourceQuality > 0 && ![TerrainType.NEST, TerrainType.WATER, TerrainType.ROAD].includes(cell.type);
const terrainLabel = (cell: HexCell) => cell.flowerStrip ? 'Flower strip' : cell.type === TerrainType.MEADOW && cell.resourceQuality === 0 ? 'Unflowering meadow' : TERRAIN_CONFIG[cell.type].label;

export const HexGrid: React.FC<Props> = ({ gameState, onHexClick }) => {
  const { map, player, species, day } = gameState;
  const playerKey = keyOf(player.q, player.r);
  const [tabStop, setTabStop] = useState(playerKey);
  const [previewKey, setPreviewKey] = useState(playerKey);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const cellsRef = useRef(new Map<string, SVGGElement>());

  useEffect(() => {
    setTabStop(playerKey);
    setPreviewKey(playerKey);
  }, [playerKey]);

  const hexPoints = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 3 * i;
    return `${HEX_SIZE * Math.cos(angle)},${HEX_SIZE * Math.sin(angle)}`;
  }).join(' '), []);

  const cells = Array.from(map.values());
  const selectedCell = map.get(previewKey) ?? map.get(playerKey);
  const selectedPreview = selectedCell ? getMovePreview(gameState, selectedCell.q, selectedCell.r) : null;
  // Do not reveal terrain on a route that the player has not explored.
  const visibleRoads = selectedPreview?.path.filter(({ q, r }) => {
    const cell = map.get(keyOf(q, r));
    return cell?.isRevealed && cell.type === TerrainType.ROAD;
  }).length ?? 0;
  const hasUnknownRoute = selectedPreview?.path.some(({ q, r }) => !map.get(keyOf(q, r))?.isRevealed) ?? false;

  const describeCell = (cell: HexCell) => {
    const here = keyOf(cell.q, cell.r) === playerKey;
    const preview = getMovePreview(gameState, cell.q, cell.r);
    const terrain = cell.isRevealed ? terrainLabel(cell) : 'Unexplored terrain';
    const parts = [`Hex ${cell.q}, ${cell.r}`, terrain];
    if (cell.isRevealed && hasFlowers(cell)) {
      const depleted = cell.lastForagedDay !== null && day - cell.lastForagedDay < RESOURCE_REGEN_DAYS;
      parts.push(depleted ? 'Flowers depleted' : 'Flowers available');
    } else if (cell.isRevealed) {
      parts.push('No flowers');
    }
    if (cell.isRevealed && cell.aphids) parts.push('Aphid patch, suitable for hoverfly egg laying');
    if (cell.isRevealed && cell.flowerStrip) parts.push('Added floral resources');
    if (here) parts.push('Current location');
    else {
      parts.push(`${preview.distance} hexes away`, `Flight costs ${formatEnergy(preview.energyCost)} energy`);
      parts.push(preview.valid ? 'Press Enter or Space to fly here' : preview.reason ?? 'Cannot fly here');
    }
    return parts.join('. ');
  };

  const focusCell = (key: string) => {
    if (!map.has(key)) return;
    setTabStop(key);
    setPreviewKey(key);
    cellsRef.current.get(key)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>, cell: HexCell) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'Home') {
      event.preventDefault();
      focusCell(playerKey);
    } else if (KEY_DIRECTIONS[key]) {
      event.preventDefault();
      const [dq, dr] = KEY_DIRECTIONS[key];
      focusCell(keyOf(cell.q + dq, cell.r + dr));
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (getMovePreview(gameState, cell.q, cell.r).valid) onHexClick(cell.q, cell.r);
    }
  };

  return (
    <section aria-label="Landscape map" className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="font-semibold text-slate-100">Explore the landscape</h2>
        <span className="text-xs text-slate-300">Outlined hexes are reachable · Symbols identify terrain</span>
      </div>
      <svg
        viewBox="-320 -350 640 700"
        className="mx-auto block w-full max-h-[65vh] min-h-[280px]"
        role="group"
        aria-label="Hex map. Tab enters the map once; use directional keys to explore its hexes."
        aria-describedby="map-keyboard-help"
        data-testid="hex-map"
      >
        {cells.map(cell => {
          const key = keyOf(cell.q, cell.r);
          const x = HEX_SIZE * 1.5 * cell.q;
          const y = HEX_SIZE * Math.sqrt(3) * (cell.r + cell.q / 2);
          const preview = getMovePreview(gameState, cell.q, cell.r);
          const isPlayer = key === playerKey;
          const isFocused = key === focusedKey;
          const isPreviewed = key === previewKey && !isPlayer;
          const fill = cell.isRevealed ? TERRAIN_CONFIG[cell.type].color : '#1e293b';

          return (
            <g
              key={key}
              ref={node => { if (node) cellsRef.current.set(key, node); else cellsRef.current.delete(key); }}
              transform={`translate(${x},${y})`}
              role="button"
              tabIndex={key === tabStop ? 0 : -1}
              aria-label={describeCell(cell)}
              aria-disabled={!preview.valid}
              aria-current={isPlayer ? 'location' : undefined}
              data-coordinate={key}
              onFocus={() => { setTabStop(key); setPreviewKey(key); setFocusedKey(key); }}
              onBlur={() => setFocusedKey(null)}
              onKeyDown={event => handleKeyDown(event, cell)}
              onMouseEnter={() => setPreviewKey(key)}
              onMouseLeave={() => setPreviewKey(tabStop)}
              onClick={() => {
                focusCell(key);
                if (preview.valid) onHexClick(cell.q, cell.r);
              }}
              className={preview.valid ? 'cursor-pointer outline-none' : 'cursor-default outline-none'}
            >
              <polygon
                points={hexPoints}
                fill={fill}
                fillOpacity={cell.isRevealed ? 1 : 0.7}
                stroke={isFocused ? '#ffffff' : isPreviewed ? '#7dd3fc' : preview.valid ? '#fde68a' : '#475569'}
                strokeWidth={isFocused ? 4 : isPreviewed ? 3 : preview.valid ? 2 : 1}
              />
              {cell.isRevealed && cell.flowerStrip && <polygon points={hexPoints} transform="scale(0.85)" fill="none" stroke="#f9a8d4" strokeWidth="2" strokeDasharray="3 2" />}
              {isFocused && <polygon points={hexPoints} fill="none" stroke="#0f172a" strokeWidth="1" transform="scale(0.84)" />}
            </g>
          );
        })}
        {selectedPreview && selectedPreview.distance > 0 && (
          <polyline
            aria-hidden="true"
            pointerEvents="none"
            points={[player, ...selectedPreview.path].map(({ q, r }) => `${HEX_SIZE * 1.5 * q},${HEX_SIZE * Math.sqrt(3) * (r + q / 2)}`).join(' ')}
            fill="none"
            stroke={selectedPreview.valid ? '#bae6fd' : '#fda4af'}
            strokeWidth="3"
            strokeDasharray="7 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <g aria-hidden="true" pointerEvents="none">
          {cells.map(cell => {
            const key = keyOf(cell.q, cell.r);
            const x = HEX_SIZE * 1.5 * cell.q;
            const y = HEX_SIZE * Math.sqrt(3) * (cell.r + cell.q / 2);
            const isPlayer = key === playerKey;
            const preview = getMovePreview(gameState, cell.q, cell.r);
            const isDepleted = cell.lastForagedDay !== null && day - cell.lastForagedDay < RESOURCE_REGEN_DAYS;
            const TerrainIcon = TERRAIN_ICONS[cell.type];
            return <g key={key} transform={`translate(${x},${y})`}>
              {cell.isRevealed && !isPlayer && <>
                <circle r="15" fill="#0f172a" fillOpacity="0.82" />
                <TerrainIcon x="-10" y="-10" width="20" height="20" color="white" strokeWidth="1.8" />
              </>}
              {isPlayer && <>
                <circle r="17" fill="#0f172a" />
                <foreignObject x="-14" y="-14" width="28" height="28">
                  <div className="flex h-full w-full items-center justify-center text-white">
                    {species?.name === SpeciesType.HOVERFLY ? <FlyIcon size={26} /> : <BeeIcon size={26} />}
                  </div>
                </foreignObject>
              </>}
              {cell.isRevealed && hasFlowers(cell) && (
                isDepleted
                  ? <path d="M-4 20 L4 20" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  : <circle cx="0" cy="20" r="3" fill="white" stroke="#0f172a" strokeWidth="1" />
              )}
              {cell.isRevealed && cell.aphids && <>
                <circle cx="17" cy="-17" r="9" fill="#831843" />
                <Bug x="11" y="-23" width="12" height="12" color="#fce7f3" strokeWidth="2" />
              </>}
              {!cell.isRevealed && <text textAnchor="middle" dominantBaseline="central" fill={preview.valid ? '#fde68a' : '#94a3b8'} fontSize="17">?</text>}
            </g>;
          })}
        </g>
      </svg>

      <div className="min-h-[5rem] rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm" aria-live="polite" aria-atomic="true">
        {selectedCell && selectedPreview && <>
          <p className="font-semibold text-slate-100">
            {selectedCell.isRevealed ? terrainLabel(selectedCell) : 'Unexplored terrain'}
            <span className="ml-2 font-normal text-slate-300">({selectedCell.q}, {selectedCell.r})</span>
          </p>
          {selectedCell.isRevealed && <p className="mt-1 text-xs text-slate-300">{hasFlowers(selectedCell) ? `Flower quality: ${selectedCell.resourceQuality}%.` : 'No floral resources.'}{selectedCell.aphids ? ' Aphids present: hoverfly egg-laying site.' : ''}{selectedCell.pesticideLevel > 0 ? ` Exposure level: ${(selectedCell.pesticideLevel * 100).toFixed(0)}%.` : ' No pesticide exposure.'}</p>}
          {keyOf(selectedCell.q, selectedCell.r) === playerKey ? (
            <p className="mt-1 text-slate-300">Your current location. Inspect another hex to preview a flight.</p>
          ) : <>
            <p className="mt-1 text-slate-200">
              Flight: {formatEnergy(selectedPreview.energyCost)} energy · Available: {formatEnergy(player.energy)}
              {selectedPreview.valid ? ' · Ready to fly' : ` · ${selectedPreview.reason ?? 'Unavailable'}`}
            </p>
            {visibleRoads > 0 && <p className="mt-1 text-amber-200">Route crosses {visibleRoads} known road {visibleRoads === 1 ? 'hex' : 'hexes'}: collision risk.</p>}
            {hasUnknownRoute && <p className="mt-1 text-slate-300">Part of this route is unexplored; hazards may be present.</p>}
          </>}
        </>}
      </div>

      <details className="mt-3 text-xs text-slate-300">
        <summary className="cursor-pointer rounded py-1 font-semibold text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">Terrain legend and keyboard controls</summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2" aria-label="Terrain legend">
          {Object.values(TerrainType).map(type => {
            const Icon = TERRAIN_ICONS[type];
            return <li key={type} className="flex items-center gap-1.5"><Icon aria-hidden="true" className="h-4 w-4" />{TERRAIN_CONFIG[type].label}</li>;
          })}
        </ul>
        <p className="mt-2 flex items-center gap-1.5"><Bug aria-hidden="true" className="h-4 w-4 text-pink-200" /> Pink insect badge: aphid patch for egg laying.</p>
        <p className="mt-2">Pink dashed border: flower strip. White dot: flowers available. Dash: flowers depleted. Question mark: unexplored.</p>
      </details>
      <p id="map-keyboard-help" className="mt-3 text-xs leading-relaxed text-slate-300">
        Keyboard: W/S up/down; Q/A upper/lower left; E/D upper/lower right. Arrow keys also explore neighbours.
        {' '}Enter or Space flies to the focused hex. Home finds your current location; Tab leaves the map.
      </p>
    </section>
  );
};
