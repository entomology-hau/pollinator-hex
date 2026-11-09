import React, { useEffect, useId, useRef } from 'react';
import { X, Battery, Skull, Flower, Sun, Target, BookOpen } from 'lucide-react';
import {
  BUMBLEBEE_POLLEN_PER_WORKER_MG, EGGS_PER_OVIPOSITION, ENERGY_PER_RESOURCE,
  FLORAL_RESERVE_CAPACITY, MAX_DAYS, MAX_EGGS_PER_DAY, MODEL_VERSION,
  OVIPOSITION_ENERGY_COST, OVIPOSITION_RESOURCE_COST, POLLEN_MG_PER_UNIT,
  RESOURCE_REGEN_DAYS, SOLITARY_POLLEN_PER_CELL_MG, SPECIES_DATA
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

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-4 text-sm leading-relaxed sm:p-6">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Target className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              Feed, survive and reproduce
            </h3>
            <p id={descriptionId}>
              Play a {MAX_DAYS}-day season as a bumblebee worker, a mature solitary bee female or a mature hoverfly female. Bees must bring pollen back to the nest; adult hoverflies must
              feed on flowers and find aphid patches for egg laying. Food supplies energy, and every
              night has a maintenance cost. Rest alone cannot keep a pollinator alive.
            </p>
            <p>
              Follow your reproductive output through the season: bees deliver pollen to support their young,
              while hoverflies lay eggs beside aphid prey. Compare how the landscape changes these outcomes.
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-2 font-bold text-white">Controls</h3>
            <p>
              Select a reachable hex to fly there. On the map, <strong>W/S</strong> explores up/down,
              <strong> Q/A</strong> upper/lower left and <strong>E/D</strong> upper/lower right.
              Arrow keys also move focus; <strong>Home</strong> returns focus to your position.
              <strong> Enter</strong> or <strong>Space</strong> flies to the focused hex. Tab reaches feeding,
              egg laying, rest and help controls. The movement preview excludes possible collision damage.
              Press <strong>Escape</strong> to close this guide.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-amber-200">
                <Flower className="h-4 w-4" aria-hidden="true" /> Bees: return the load
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Foraging fills a limited pollen load and also supplies feeding energy.</li>
                <li>Arriving alive at the nest automatically deposits your load. Only delivered pollen contributes to the nest's reproductive output.</li>
                <li>Each complete {BUMBLEBEE_POLLEN_PER_WORKER_MG} mg of pollen-equivalent delivered by a bumblebee supports one new worker; each complete {SOLITARY_POLLEN_PER_CELL_MG} mg delivered by a solitary bee provisions one nest cell.</li>
                <li>A full load does not prevent feeding, but extra pollen cannot be carried. Pollen left in your load at the end of a run is unprovisioned.</li>
                <li>The central nest is the bees' only safe night shelter in this model.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-cyan-200">
                <Flower className="h-4 w-4" aria-hidden="true" /> Hoverflies: feed, then lay eggs
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Adult floral feeding supplies energy and builds a reproductive reserve, up to {FLORAL_RESERVE_CAPACITY} units.</li>
                <li>On a tile with aphids, lay {EGGS_PER_OVIPOSITION} eggs using {OVIPOSITION_RESOURCE_COST} reserve units and {OVIPOSITION_ENERGY_COST} energy. Each patch can be used once per day, with a daily limit of {MAX_EGGS_PER_DAY} eggs.</li>
                <li>Eggs are laid beside aphids, where the larvae can find prey. The adult feeds on flowers, not aphids.</li>
                <li>Hoverflies can shelter safely in woodland, urban gardens or the central shelter, without returning a load to a nest.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Battery className="h-5 w-5 text-emerald-300" aria-hidden="true" /> Energy and time
            </h3>
            <p>
              Foraging gains {ENERGY_PER_RESOURCE} energy per harvested resource unit, minus its action cost,
              capped at your energy capacity. Flying and egg laying also cost energy. Ending a day consumes
              the maintenance amount below, including the final day; it does not replenish energy.
              At zero energy the run ends.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Pollinator carrying capacity and daily maintenance</caption>
                <thead className="bg-slate-800 text-white"><tr><th className="p-3">Pollinator</th><th className="p-3">Pollen load limit</th><th className="p-3">Daily energy cost</th></tr></thead>
                <tbody>{Object.values(SPECIES_DATA).map(species => <tr key={species.name} className="border-t border-slate-700"><th scope="row" className="p-3 font-medium">{species.name}</th><td className="p-3">{species.carryingCapacity ? `${species.carryingCapacity * POLLEN_MG_PER_UNIT} mg pollen-equivalent` : 'No pollen load'}</td><td className="p-3">{species.dailyMaintenance}</td></tr>)}</tbody>
              </table>
            </div>
            <p>
              Foraged flowers replenish after {RESOURCE_REGEN_DAYS} days. Moving, feeding and egg laying do not
              themselves advance the day. A game day is a turn, not a literal activity budget. Think ahead about
              depleted patches, return flight costs and tonight's maintenance.
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-purple-200">
              <Skull className="h-4 w-4" aria-hidden="true" /> Hazards and shelter
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Landing on or feeding in an exposed patch adds toxicity. Exposure depends on management settings, not habitat identity alone.</li>
              <li>Above half the pollinator's toxicity limit, flight costs rise by 50% and foraging yield falls by 25%. At the limit, the run ends.</li>
              <li>Every road hex crossed on the displayed route has a 25% collision chance; a collision costs 35 energy. Unknown route sections may hide hazards.</li>
              <li>Ending a day outside your pollinator's safe shelter carries a 15% predation risk.</li>
              <li>Water and roads have no forage. Water supplies neither energy nor detoxification.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-blue-800/50 bg-blue-900/20 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-200">
              <Sun className="h-4 w-4" aria-hidden="true" /> Habitat and weather
            </h3>
            <p>
              Resource quality differs among patches. Flower strips can add resources without changing the underlying
              habitat. Aphid patches identify potential hoverfly oviposition sites, not food for the adult.
              Inspect the current tile's available resources and exposure rather than assuming all crops or gardens are alike.
            </p>
            <p className="mt-2">
              The seed fixes the daily weather sequence. Rain doubles flight costs and reduces resource yield to 20%
              of its sunny value; cloudy weather multiplies costs by 1.2 and yield by 0.8. These illustrative effects
              apply equally to all three functional types; cold tolerance is not modelled.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Target className="h-5 w-5 text-emerald-300" aria-hidden="true" /> Predict, test, interpret
            </h3>
            <ol className="list-decimal space-y-3 pl-5">
              <li><strong>Predict:</strong> choose a scenario and state which outcome you expect to change, and why.</li>
              <li><strong>Test:</strong> compare control and intervention using the same seed, pollinator and agreed foraging strategy. The seed holds the comparison landscape and weather constant.</li>
              <li><strong>Repeat:</strong> use additional seeds for independent simulated environments. Replaying the same seed is useful practice, but is not a new independent replicate. Changing the trial number alone does not change the environment.</li>
              <li><strong>Interpret:</strong> compare survival, delivered resources or oviposition, distance and exposure. Which differences reflect the treatment, your decisions, chance or the model's assumptions?</li>
            </ol>
            <dl className="space-y-3">
              <div><dt className="font-semibold text-lime-200">Flower strips and nest provisioning</dt><dd>Add floral resources along a corridor while keeping the rest of the landscape fixed. Does this change the cost of delivering pollen?</dd></div>
              <div><dt className="font-semibold text-purple-200">Reduced pesticide exposure</dt><dd>Reduce exposure while retaining the same resources and landscape. Does this alter survival, resource delivery or impairment?</dd></div>
              <div><dt className="font-semibold text-cyan-200">Flowers near aphid patches</dt><dd>Move the same quantity of floral resources closer to aphid patches. Does their arrangement change the hoverfly's feeding–oviposition trade-off?</dd></div>
            </dl>
            <p>
              The same seed, settings, pollinator and action sequence reproduce the same run. Weather and hazards use
              separate random streams, so extra actions do not reroll the weather. Different strategies can still encounter
              different hazards. A seed is a reproducibility aid, not a guarantee of equal outcomes.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-700 pt-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <BookOpen className="h-5 w-5 text-amber-300" aria-hidden="true" /> Results and model assumptions
            </h3>
            <p>
              Completed runs appear in the trial history. Up to 100 recent results are saved in this browser when local
              storage is available; export them for your worksheet or analysis. The summary CSV contains settings and outcomes;
              the action-history CSV contains the sequence of recorded events. Compare reproductive outputs within the same pollinator type
              and model version, alongside survival, distance travelled and exposure.
            </p>
            <p>
              Model {MODEL_VERSION} uses fictionalised reproductive outputs with research-informed reference quantities:
              the bumblebee conversion rounds an EFSA larval pollen reference, the solitary bee conversion rounds a measured
              median dry-pollen provision, and the hoverfly's daily limit draws on laboratory egg laying. The allocation of
              {` ${EGGS_PER_OVIPOSITION}`} eggs per visit is a game rule. Workers supported and nest cells provisioned describe
              investment in future offspring, not adults emerging during these {MAX_DAYS} days. Other nutritional needs,
              development and offspring survival are simplified; energy, carrying limits and hazards remain game parameters.
            </p>
            <p className="font-semibold text-white">Research behind the teaching model</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.2903/j.efsa.2023.7989" target="_blank" rel="noreferrer">EFSA (2023): bee risk-assessment guidance and bumblebee larval food references (opens in a new tab)</a></li>
              <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1002/ieam.4489" target="_blank" rel="noreferrer">Pamminger et al. (2022): pollen provisions for the red mason bee, Osmia bicornis (opens in a new tab)</a></li>
              <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://www.eje.cz/pdfs/eje/2000/02/06.pdf" target="_blank" rel="noreferrer">Branquart & Hemptinne (2000): egg production in the hoverfly Episyrphus balteatus (PDF, opens in a new tab)</a></li>
              <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1016/j.biocontrol.2013.06.014" target="_blank" rel="noreferrer">van Rijn, Kooijman & Wäckers (2013): adult floral nutrition and predatory hoverfly performance (opens in a new tab)</a></li>
              <li><a className="text-blue-200 underline underline-offset-2 hover:text-white" href="https://doi.org/10.1111/1365-2745.13598" target="_blank" rel="noreferrer">Tew et al. (2021): nectar resources in urban and rural landscapes (opens in a new tab)</a></li>
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
