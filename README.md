# Pollinator Hex

A turn-based ecology teaching game for Harper Adams University biosciences students. Choose a bumblebee worker, a mature solitary bee female or a mature hoverfly female, explore a hex landscape and balance nutrition, reproduction and hazards over a 15-day season.

[Play Pollinator Hex](https://entomology-hau.github.io/pollinator-hex/)

## Playing

1. Choose a teaching scenario, control or intervention, a seed and a pollinator. Make a prediction before playing.
2. Click or tap a reachable hex. The movement preview shows flight cost and known road hazards; unknown terrain stays hidden until explored.
3. Feed on available flowers to gain resources and energy. Used patches replenish after three days.
4. Bees carry a limited pollen load. Arrive alive at the central nest to deposit it automatically; only delivered pollen contributes to the nest's reproductive output.
5. Hoverflies feed to build a floral reserve, then lay eggs on an aphid patch. Adult hoverflies do not eat aphids.
6. End the day in suitable shelter where possible. Every day consumes maintenance energy; resting does not create food or restore energy.
7. Review the outcome, repeat the comparison with the same seed, then try further seeds. Export finished trials and action histories for analysis.

Keyboard: Tab into the map; W/S explores up/down, Q/A upper/lower left and E/D upper/lower right. Arrow keys also move focus; Home selects the current position. Enter/Space flies to the focused tile. Tab then reaches the action controls. Escape closes the field guide and restores focus. The native modal makes background controls inactive.

Field notes, latest-action feedback and terrain symbols remain available at every screen size.

## Ecological rules

| Functional type | Pollen carrying capacity | Daily maintenance | Reproductive outcome | Safe night shelter |
| --- | ---: | ---: | --- | --- |
| Bumblebee | 30 mg pollen-equivalent | 12 energy | One worker supported per 60 mg delivered | Central nest |
| Solitary bee | 15 mg pollen-equivalent | 8 energy | One nest cell provisioned per 65 mg delivered | Central nest |
| Hoverfly | No pollen load | 8 energy | 10 eggs per oviposition visit; at most 100 eggs per day | Woodland, urban gardens or central shelter |

Foraging yields resources according to patch quality, weather and the functional type's efficiency. It gains four energy per harvested resource unit, minus the foraging cost, capped at the pollinator's energy capacity. Each bee resource unit represents 1 mg pollen-equivalent. Bees can still feed when their carrying load is full, but cannot carry extra pollen. A surviving arrival at the nest deposits the carried load. Worker and nest-cell outputs count whole completed provisions, rounding down. Undelivered pollen does not contribute to provisioning, including pollen carried when the run ends.

Hoverflies store up to 30 floral reserve units. On an aphid-bearing tile, an oviposition visit consumes six reserve units and four energy and adds 10 eggs laid. Each patch can be used once per day, subject to a daily limit of 100 eggs. Larval feeding, development and pest suppression are not simulated.

Ending every day, including the final day, consumes maintenance energy. At zero energy the run ends. There is a 15% night-time predation risk outside suitable shelter. Shelter provides safety, not free energy, so waiting without feeding eventually causes starvation.

Every traversed road hex has a 25% collision chance, costing 35 energy. Lethal collisions stop the flight at that road. Water supplies neither food nor detoxification. Landing on or feeding in an exposed patch adds toxicity. Above half the pollinator's toxicity limit, movement costs rise by 50% and yield falls by 25%; reaching the limit ends the run.

Rain doubles movement costs and reduces resource yield to 20% of its sunny value. Cloudy weather multiplies costs by 1.2 and yield by 0.8. The seed fixes the daily weather schedule independently of actions and species.

## Controlled teaching scenarios

| Scenario | Control/intervention comparison | Suggested response variables |
| --- | --- | --- |
| Flower strips and nest provisioning | Add five flowering cells along a corridor; keep other landscape attributes fixed | Delivered pollen, distance, energy expenditure, survival |
| Reduced pesticide exposure | Reduce each exposed tile to one quarter of its baseline exposure, with the same landscape and resource supply | Toxicity accumulated, exposure events, delivered pollen or eggs laid, survival |
| Flowers near aphid patches | Place four equal floral patches farther from or nearer to two fixed aphid patches | Hoverfly eggs laid, distance, floral reserve, survival |

Use a **predict → test → interpret** sequence. State a hypothesis, hold the seed and pollinator constant across a control/intervention pair, and agree a foraging strategy before comparing outcomes. Repeat across additional seeds to sample different simulated environments. A replay of the same seed is practice or a repeated strategy comparison, not an independent environmental replicate. Changing the trial number alone does not reroll the landscape.

The same seed, scenario settings, pollinator and action sequence reproduce the same run. Map generation, daily weather, road hazards and night hazards use separate deterministic streams. Extra movement does not change tomorrow's weather. Different choices can still encounter different risks; seeded comparisons do not eliminate all consequences of strategy.

## Results and export

Finished runs are saved locally in the current browser when storage is available, retaining up to 100 recent trials. They are not uploaded to a server or synchronised between devices. Export results for longer-term use, especially on shared computers or if browser storage is unavailable. Trial history supports within-species/scenario comparisons and repeating a saved setup.

- **Summary CSV:** trial identity, model version, scenario, condition, seed, species, settings, weather sequence, survival, day reached, completed days, reproductive outcomes, resources, movement, exposure, collisions and energy expenditure.
- **Action-history CSV:** the recorded events for each saved trial, identified by trial, scenario, condition, seed, species and day.

CSV exports include all saved trials, independently of the comparison filters. Strings are escaped for CSV and protected against spreadsheet formula interpretation. A trial's full settings are retained so results can be interpreted after later model changes.

## Model assumptions

The choices are simplified functional types, with reproductive reference quantities drawn from *Bombus terrestris*, *Osmia bicornis* and *Episyrphus balteatus*. Energy, resource quality, exposure, carrying capacity, maintenance and hazard values are game parameters. Habitat and management are represented separately; these scenarios do not imply that all crops are exposed or all gardens are safe. A game day is a turn rather than a literal daily activity budget.

Reproductive outputs are fictionalised using research-informed reference quantities. Workers supported and nest cells provisioned represent investment in future offspring, not adults emerging within the 15-day season. The hoverfly starts as a mature female. Additional nutritional requirements, development and offspring survival are simplified, so outputs are not forecasts of population growth. Compare the same pollinator type and model version. Pollen specialisation, cold tolerance, colony demography, realised biocontrol and plant pollination success are not modelled.

| Output conversion | Evidence and model interpretation |
| --- | --- |
| 60 mg pollen-equivalent per bumblebee worker supported | Rounded from EFSA's 60.23 mg *B. terrestris* larval pollen reference over development. This is a risk-assessment reference selected from the available evidence, not a field mean. Pollen alone does not supply all nutrition needed to rear a worker. |
| 65 mg pollen-equivalent per solitary bee nest cell provisioned | Rounded from Pamminger et al.'s median 64.23 mg dry-pollen provision for *O. bicornis* (161 provisions). Game units standardise these reference quantities as pollen-equivalents. |
| 10 hoverfly eggs per visit, at most 100 eggs per day | Branquart & Hemptinne reported a laboratory mean of 108 eggs per day over 30 days for *E. balteatus* (six females). The daily limit is rounded from that reference; 10 eggs per visit is a fictional gameplay allocation, not a measured clutch size. |

The 30 mg and 15 mg bee carrying limits, floral reserve units and oviposition costs are gameplay choices rather than measured physiological limits.

Research behind the teaching model:

- EFSA (2023), [Revised guidance on the risk assessment of plant protection products on bees](https://doi.org/10.2903/j.efsa.2023.7989), Table 16; see also the [supporting literature review](https://doi.org/10.2903/sp.efsa.2023.EN-7982), p. 53, for the bumblebee reference selection.
- Pamminger et al. (2022), [pollen provision measurements for *Osmia bicornis*](https://doi.org/10.1002/ieam.4489).
- Branquart & Hemptinne (2000), [Development of ovaries, allometry of reproductive traits and fecundity of *Episyrphus balteatus*](https://www.eje.cz/pdfs/eje/2000/02/06.pdf), Table 3.
- van Rijn, Kooijman & Wäckers (2013), [The contribution of floral resources and honeydew to the performance of predatory hoverflies](https://doi.org/10.1016/j.biocontrol.2013.06.014).
- Tew et al. (2021), [Quantifying nectar production by flowering plants in urban and rural landscapes](https://doi.org/10.1111/1365-2745.13598).

## Development

The landing-page logos are the existing white Harper Adams University and Applied Entomology assets from [EntoHub](https://github.com/entomology-hau/entohub/tree/main/site/assets), bundled locally in `public/branding`. Species icons are simplified original SVG illustrations, with distinct bumblebee, red mason bee and marmalade hoverfly shapes. Identification references include [BWARS: *Bombus terrestris*](https://bwars.com/bee/apidae/bombus-terrestris), [BWARS: *Osmia bicornis*](https://bwars.com/content/beginners-bees-wasps-osmia-bicornis-red-mason-bee) and the [National Biodiversity Data Centre hoverfly guide](https://biodiversityireland.ie/app/uploads/2015/03/Simple-guide-to-4-Irish-hoverfly-species2.pdf).

Requires Node.js 22 or later and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

The app uses React, TypeScript and Vite. Tailwind CSS is compiled locally; no runtime styling CDN or API key is needed. The Vite base path is `/pollinator-hex/` for GitHub Pages.

- `game/rules.ts`: immutable transitions, action validation, movement previews and reproductive output definitions.
- `game/scenarios.ts`: scenario metadata, configuration normalisation and controlled environments.
- `game/random.ts`: deterministic keyed randomness with separate environmental and hazard streams.
- `game/trials.ts`: finished-trial snapshots, local persistence and CSV exports.

Pull requests run tests and a production build. Pushes to `main` or `master` run the same checks before deploying `dist` to `gh-pages`.

### Manual release checks

- Play using only the keyboard: select a scenario/species, navigate, forage, provision a nest or oviposit, end days and restart.
- Open help during a run; verify background controls cannot act, focus stays inside the dialog, Escape closes it and focus returns to the invoking button.
- Check menu, map, controls, comparisons and results at 390×844, 768×1024 and 1366×768, plus 200% zoom. All content must remain reachable without horizontal page overflow; wide data tables may scroll within their container.
- Repeat the same setup and action sequence; verify matching outcomes. Change only treatment and verify that the intended environmental factor changes.
- Finish trials, refresh the page and check retained history. Export both CSV files and compare their settings and outcomes with the display.
- Check screen-reader labels, colour-independent symbols and announcements for unavailable actions. Test storage-unavailable feedback without losing in-memory results.
