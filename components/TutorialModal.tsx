import React, { useEffect, useId, useRef } from 'react';
import { X, Battery, Skull, Flower, Sun, Target, BookOpen } from 'lucide-react';
import {
  BUMBLEBEE_POLLEN_PER_WORKER_MG, HOVERFLY_APHID_BONUS_MULTIPLIER,
  HOVERFLY_RESOURCES_PER_EGG, MAX_DAYS, MODEL_VERSION,
  SOLITARY_POLLEN_PER_CELL_MG, RESOURCE_REGEN_DAYS,
  SHELTER_REST_RECOVERY, OPEN_REST_RECOVERY
} from '../constants';

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
            Field guide
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

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 text-sm leading-relaxed sm:p-6">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Target className="h-5 w-5 text-emerald-300" aria-hidden="true" /> Move, forage, rest
            </h3>
            <p id={descriptionId}>
              Gather resources through a {MAX_DAYS}-day season. Every pollinator uses the same three actions:
              fly to a patch, forage on its flowers, then rest when ready. Gathered resources
              immediately contribute to reproductive output; surviving alone is not the objective.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li><strong>Move:</strong> select a reachable hex. Check the flight cost and known hazards.</li>
              <li><strong>Forage:</strong> collect resources for reproduction. Meadows, flowering crops, woodland and urban gardens offer varying flower resources; used patches replenish after {RESOURCE_REGEN_DAYS} days.</li>
              <li><strong>Rest:</strong> recover some energy and advance to tomorrow. Leave enough energy to reach shelter.</li>
            </ol>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-amber-200">
              <Flower className="h-4 w-4" aria-hidden="true" /> Resources support reproduction
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Resources needed for each reproductive outcome</caption>
                <thead className="text-white"><tr><th scope="col" className="pb-2 pr-3">Pollinator</th><th scope="col" className="pb-2">Automatic output</th></tr></thead>
                <tbody>
                  <tr className="border-t border-slate-700"><th scope="row" className="py-2 pr-3 font-medium">Bumblebee</th><td className="py-2">One worker supported per {BUMBLEBEE_POLLEN_PER_WORKER_MG} mg pollen-equivalent gathered</td></tr>
                  <tr className="border-t border-slate-700"><th scope="row" className="py-2 pr-3 font-medium">Solitary bee</th><td className="py-2">One nest cell provisioned per {SOLITARY_POLLEN_PER_CELL_MG} mg pollen-equivalent gathered</td></tr>
                  <tr className="border-t border-slate-700"><th scope="row" className="py-2 pr-3 font-medium">Hoverfly</th><td className="py-2">One egg supported per {HOVERFLY_RESOURCES_PER_EGG} resource units gathered</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Bumblebee gathering represents colony resource allocation; solitary bee gathering represents
              one nesting female. Game actions compress real foraging, with fictional scaling for each species.
              Outputs count whole workers, cells or eggs, rounding down. Resources already gathered remain
              part of your result if the season ends early.
            </p>
            <p>
              <strong className="text-cyan-200">Hoverfly habitat bonus:</strong> forage on flowers with aphids on the same
              or a neighbouring hex to gain {Math.round((HOVERFLY_APHID_BONUS_MULTIPLIER - 1) * 100)}% extra resource credit,
              rounded down. This represents nearby prey for future larvae. Adult hoverflies feed on flowers;
              the habitat bonus supplies no extra feeding energy.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Battery className="h-5 w-5 text-emerald-300" aria-hidden="true" /> Energy and shelter
            </h3>
            <p>
              Energy is your activity budget. Flying uses it; feeding during foraging can replenish it,
              particularly on flowering crops. The Forage preview shows the net change after the action cost,
              which can be a small loss. At zero energy the run ends through exhaustion.
            </p>
            <p>
              Bees shelter at the central nest. Hoverflies can also shelter in woodland and urban gardens.
              Rest restores up to {SHELTER_REST_RECOVERY} energy in shelter or {OPEN_REST_RECOVERY} in the open and advances the day.
              An exposed night has a 15% predation risk. Moving and foraging do not advance the day.
              Balance another foraging visit against the trip home. Resting without foraging earns no reproductive output.
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-purple-200">
              <Skull className="h-4 w-4" aria-hidden="true" /> Watch the hazards
            </h3>
            <p>
              Landing on or feeding in an exposed patch adds toxicity. Above half your toxicity limit,
              flight costs rise by 50% and forage yield falls by 25%. At the limit, the run ends.
            </p>
            <p>
              Each road hex crossed has a 25% collision chance, costing 35 energy. The movement preview
              excludes possible collision damage. The nest, water and roads supply no food; water does not remove toxicity.
            </p>
            <p className="flex items-start gap-2 text-blue-100">
              <Sun className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Rain increases flight costs by 50% and keeps 60% of usual yield; cloud increases costs by 20% and keeps 80% of yield.
              Check the day's weather before travelling.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Target className="h-5 w-5 text-emerald-300" aria-hidden="true" /> Compare your results
            </h3>
            <p>
              Predict how the treatment will change reproductive output. Compare <strong>Control</strong> with
              <strong> Treatment</strong>, using the same scenario, pollinator
              and agreed settings. Keep species and scenarios separate.
            </p>
            <p>
              The same seed holds the background landscape and weather constant. Use comparable strategies across
              conditions; repeat across new seeds to sample different environments. Replaying a seed is useful
              practice but is not an independent environmental replicate.
            </p>
            <p>
              Finished runs are saved in this browser, up to 100 results. Export settings and outcomes
              or the action history as CSV for later analysis. Compare results from the same model version.
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-2 font-bold text-white">Keyboard controls</h3>
            <p>
              Tab through the action buttons into the map. <strong>W/S</strong> explores up/down, <strong>Q/A</strong> upper/lower left and
              <strong> E/D</strong> upper/lower right. Arrow keys also move focus; <strong>Home</strong> selects
              your position. <strong>Enter</strong> or <strong>Space</strong> flies to the focused hex.
              <strong>Shift+Tab</strong> returns to the action buttons. <strong>Escape</strong> closes this guide.
            </p>
          </section>

          <details className="border-t border-slate-700 pt-4">
            <summary className="cursor-pointer font-bold text-amber-200">
              <BookOpen className="mr-2 inline h-4 w-4" aria-hidden="true" /> Model notes and references
            </summary>
            <div className="mt-3 space-y-3">
              <p>
                Model {MODEL_VERSION} uses fictionalised reproductive output to represent nutritional support for
                future offspring. Bee quantities draw on representative pollen requirements; the hoverfly conversion
                and habitat bonus are gameplay parameters. Delivery, egg laying, development and offspring survival
                are simplified into the resource total. These outcomes are not predictions of adults emerging during
                the {MAX_DAYS}-day game. Energy, exposure, weather and hazards are also illustrative parameters.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.2903/j.efsa.2023.7989" target="_blank" rel="noreferrer">EFSA (2023): bumblebee larval pollen reference (opens in a new tab)</a></li>
                <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1002/ieam.4489" target="_blank" rel="noreferrer">Pamminger et al. (2022): red mason bee pollen provisions (opens in a new tab)</a></li>
                <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1016/j.biocontrol.2013.06.014" target="_blank" rel="noreferrer">van Rijn, Kooijman & Wäckers (2013): floral nutrition and hoverfly performance (opens in a new tab)</a></li>
                <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1111/1365-2745.13598" target="_blank" rel="noreferrer">Tew et al. (2021): nectar resources across landscapes (opens in a new tab)</a></li>
              </ul>
            </div>
          </details>
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
