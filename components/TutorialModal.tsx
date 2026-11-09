import React, { useEffect, useId, useRef } from 'react';
import { X, Battery, Skull, Flower, Sun, Target, BookOpen } from 'lucide-react';
import { MAX_DAYS, RESOURCE_REGEN_DAYS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** Native modal dialogs keep every game panel inert, including positioned HUDs. */
export const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (!dialog.open) dialog.showModal();
    titleRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-3xl max-h-[90dvh] overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 p-0 text-slate-200 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[calc(90dvh_-_2px)] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-700 p-4 sm:p-6">
          <h2 ref={titleRef} id={titleId} tabIndex={-1} className="text-xl font-bold text-amber-300 outline-none sm:text-2xl">
            Field guide & model assumptions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close field guide"
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-4 text-sm leading-relaxed sm:p-6">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Target className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              Survive and collect resources
            </h3>
            <p id={descriptionId}>
              Play a {MAX_DAYS}-day season and balance resource collection against flight costs and hazards.
              The final reproductive score is an <strong>illustrative game score</strong>, not a prediction
              of workers, offspring or larvae produced. Surviving at the shelter without feeding is possible
              in this version, but gives a reproductive score of zero.
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-2 font-bold text-white">Controls</h3>
            <p>
              Select a reachable hex to move. On the map, <strong>W/S</strong> explores up/down,
              <strong> Q/A</strong> upper/lower left and <strong>E/D</strong> upper/lower right.
              Arrow keys also move focus; <strong>Home</strong> returns focus to your current position.
              Press <strong>Enter</strong> or <strong>Space</strong> to fly to the focused tile. Tab reaches the
              feeding, rest and help controls. Read the move preview before committing; its energy cost
              does not include possible collision damage. Press <strong>Escape</strong> to close this guide.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-amber-200">
                <Battery className="h-4 w-4" aria-hidden="true" /> Energy and time
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Flying costs energy according to distance, weather and impairment.</li>
                <li>Foraging costs energy and yields resources according to tile quality, pollinator type and weather.</li>
                <li>Rest ends the day. At the nest/shelter it restores up to 40 energy; elsewhere it restores up to 20, with a 15% chance of predation.</li>
                <li>Foraged tiles replenish after {RESOURCE_REGEN_DAYS} days. Moving or feeding does not itself advance the day.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-purple-200">
                <Skull className="h-4 w-4" aria-hidden="true" /> Exposure and road hazards
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Landing on or feeding in exposed crop and garden tiles increases the model's toxicity load.</li>
                <li>At the pollinator's toxicity limit, the run ends. Above 50% of that limit, flight costs rise by 50% and resource yield falls by 25%.</li>
                <li>Each road hex crossed on the displayed route has a 25% collision chance. A collision costs 35 energy; a longer move does not bypass the road.</li>
                <li>Water provides no food, energy or detoxification. Flying to it still costs energy.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Flower className="h-5 w-5 text-pink-300" aria-hidden="true" /> Landscape and pollinators
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="font-bold text-lime-300">Meadow and woodland</dt><dd>Both use the same baseline resource range in this version. Compare their displayed quality; woodland is not automatically less rewarding.</dd></div>
              <div><dt className="font-bold text-yellow-300">Flowering crops</dt><dd>Yield is multiplied by 1.5 and feeding gives a small energy bonus. Crop tiles are exposed to pesticides in this scenario.</dd></div>
              <div><dt className="font-bold text-slate-200">Urban gardens</dt><dd>Provide quality-dependent floral resources and variable exposure. These settings describe the game scenario, not all real gardens.</dd></div>
              <div><dt className="font-bold text-amber-200">Nest / shelter</dt><dd>A safe place to end the day. All three pollinator types currently share this rule; load delivery and distinct nesting behaviour are not simulated.</dd></div>
              <div><dt className="font-bold text-cyan-200">Adult hoverflies</dt><dd>Feed on floral resources. Adult feeding does not earn an aphid-eating bonus. Aphid predation by larvae of some hoverfly species is a separate process, absent from this version.</dd></div>
              <div><dt className="font-bold text-slate-200">Roads and water</dt><dd>Contain no forage. Roads add collision risk along a flight route; water is simply a non-foraging tile.</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-blue-800/50 bg-blue-900/20 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-200">
              <Sun className="h-4 w-4" aria-hidden="true" /> Weather
            </h3>
            <p>
              Weather is chosen again each day. In rain, flight costs double and resource yield is 20%
              of the sunny value. Cloudy weather multiplies flight cost by 1.2 and yield by 0.8.
              These same illustrative multipliers apply to every pollinator type; cold tolerance is not modelled.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-700 pt-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <BookOpen className="h-5 w-5 text-amber-300" aria-hidden="true" /> Interpreting your results
            </h3>
            <p>
              The three choices are simplified functional types. Energy, exposure, recovery, replenishment
              and score conversions are game assumptions rather than calibrated biological measurements.
              The game does not model larval development, pollen specialisation, colony demography or food delivery.
              Rest restores energy without consuming a food store. A game day is a turn, not a literal daily activity budget.
            </p>
            <p>
              Maps, weather and risks vary between new runs, so a single difference in scores cannot establish a species
              effect. Ask which outcomes reflect your decisions, chance or the model's assumptions.
            </p>
            <p className="font-semibold text-white">Research to discuss alongside the game</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1016/j.biocontrol.2013.06.014" target="_blank" rel="noreferrer">
                  van Rijn, Kooijman & Wäckers (2013): adult floral nutrition and predatory hoverfly performance (opens in a new tab)
                </a>
              </li>
              <li>
                <a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1111/1365-2745.13598" target="_blank" rel="noreferrer">
                  Tew et al. (2021): nectar resources in urban and rural landscapes (opens in a new tab)
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-700 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-600 px-6 py-2 font-bold text-white hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Return to game
          </button>
        </div>
      </div>
    </dialog>
  );
};
