# Pollinator Hex

A turn-based ecology teaching game for Harper Adams University biosciences students. Choose a bumblebee worker, a mature solitary bee female or a mature hoverfly female, then gather resources and survive a 15-day season.

[Play Pollinator Hex](https://entomology-hau.github.io/pollinator-hex/)

## Playing

All three pollinators use the same loop: **move → forage → end day**.

1. Choose a scenario, control or treatment, a seed and a pollinator. Make a prediction.
2. Fly to a reachable hex. The movement preview shows flight cost and known road hazards; unknown terrain stays hidden until explored.
3. Forage on flowers to collect resources and recover energy. Gathered resources immediately contribute to reproductive output. Used patches replenish after three days.
4. End the day in suitable shelter where possible, keeping enough energy for maintenance.
5. Report your pollinator, condition and final reproductive output on the class graph. Repeat the comparison with the same seed, then try additional seeds.

Keyboard: Tab into the map; W/S explores up/down, Q/A upper/lower left and E/D upper/lower right. Arrow keys also move focus; Home selects the current position. Enter/Space flies to the focused tile. Tab reaches the action controls. Escape closes the field guide and restores focus. The native modal makes background controls inactive.

## Resources and reproductive output

| Pollinator | Automatic reproductive output | Daily maintenance | Safe night shelter |
| --- | --- | ---: | --- |
| Bumblebee | One worker supported per 60 mg pollen-equivalent gathered | 12 energy | Central nest |
| Solitary bee | One nest cell provisioned per 65 mg pollen-equivalent gathered | 8 energy | Central nest |
| Hoverfly | One egg supported per three resource units gathered | 8 energy | Woodland, urban gardens or central shelter |

A single cumulative resource total drives each pollinator's output. Bee resource units represent 1 mg pollen-equivalent. Outputs count whole workers, cells or eggs, rounding down. Resources already gathered remain in the result if the run ends early.

Foraging yield depends on patch quality, weather and species efficiency. Flowering crops retain the original 1.5× harvest multiplier. A hoverfly foraging on flowers gains 50% extra reproductive resource credit when aphids occupy the same hex or one of its six neighbours; the total credited harvest is rounded down. This automatic bonus represents nearby prey for future larvae. Adult hoverflies feed on flowers. The bonus does not increase feeding energy, and depleted flowers cannot award it again until they replenish.

Foraging supplies four energy per actual harvested unit, minus the action cost, capped at the pollinator's energy capacity. Flying also costs energy. Ending every day, including the final day, consumes maintenance energy; zero energy ends the run. Shelter protects against night predation but does not restore energy. Exposed nights have a 15% predation risk.

Every traversed road hex has a 25% collision chance, costing 35 energy. A lethal collision stops the flight at that road. Water supplies neither food nor detoxification. Landing on or feeding in an exposed patch adds toxicity. Above half the pollinator's toxicity limit, movement costs rise by 50% and yield falls by 25%; reaching the limit ends the run.

Rain doubles movement costs and reduces resource yield to 20% of its sunny value. Cloudy weather multiplies costs by 1.2 and yield by 0.8. The seed fixes weather independently of actions and species.

## Class comparisons

| Scenario | Control/treatment comparison | Main class response |
| --- | --- | --- |
| Flower strips and foraging | Add five flowering cells along a corridor; keep other landscape attributes fixed | Final reproductive output |
| Reduced pesticide exposure | Reduce exposure to one quarter, retaining the same landscape and floral supply | Final reproductive output |
| Flowers near aphid patches | Move four equal floral patches closer to two fixed aphid patches | Hoverfly eggs supported |

Use a **predict → test → interpret** sequence. On the class spreadsheet or whiteboard, record one final output under **Control** or **Treatment**. Keep species and scenarios separate because their outputs have different meanings. Agree the settings and a comparable strategy before play. For a paired comparison, hold the seed and pollinator constant across both conditions. Repeat across additional seeds to sample different simulated environments; replaying the same seed is not an independent environmental replicate. Survival, distance and exposure can support discussion of the differences.

The same seed, settings, pollinator and action sequence reproduce the same run. Map generation, weather, road hazards and night hazards use separate deterministic streams. Extra movement does not change tomorrow's weather, but different choices can encounter different risks.

## Saved results and export

Finished runs are saved locally in the current browser when storage is available, retaining up to 100 recent results. Export them for longer-term use or on shared computers. Summary CSVs retain model version, scenario, condition, seed, species, settings, survival, reproductive output, gathered resources and activity metrics. Action-history CSVs retain the event sequence.

Exports include all saved results, independently of the comparison filters. Text is escaped for CSV and protected against spreadsheet formula interpretation. Saved settings preserve the meaning of older results. Compare only the same species, scenario and model version; model 2.0 provisioning/egg-laying results should not be pooled with model 3.0 resource-based results.

## Model assumptions and evidence

Model 3.0 represents reproductive health through resources gathered. Delivery, egg laying, development and offspring survival are folded into this simple teaching proxy. The outcomes describe support for future offspring, not adults emerging within the 15-day game or forecasts of population growth. Species traits, resource quality, energy, exposure, weather and hazards are game parameters. A game day is a turn rather than a literal daily activity budget. Habitat and management are represented separately; crops are not invariably exposed, and gardens are not invariably safe.

| Conversion | Evidence and interpretation |
| --- | --- |
| 60 mg pollen-equivalent per bumblebee worker supported | Rounded from EFSA's 60.23 mg *Bombus terrestris* larval pollen reference over development. This is a risk-assessment reference selected from available evidence, not a field mean. Pollen alone does not supply all nutrition needed to rear a worker. |
| 65 mg pollen-equivalent per solitary bee nest cell provisioned | Rounded from Pamminger et al.'s median 64.23 mg dry-pollen provision for *Osmia bicornis* (161 provisions). Game units standardise these references as pollen-equivalents. |
| Three hoverfly resource units per egg supported; 50% nearby-aphid bonus | Simple gameplay conversions, not measured physiological yields. They express how adult floral nutrition and nearby larval prey can support reproduction in *Episyrphus balteatus*. |

Research behind the teaching model:

- EFSA (2023), [Revised guidance on the risk assessment of plant protection products on bees](https://doi.org/10.2903/j.efsa.2023.7989), Table 16; see the [supporting literature review](https://doi.org/10.2903/sp.efsa.2023.EN-7982), p. 53, for the bumblebee reference selection.
- Pamminger et al. (2022), [pollen provision measurements for *Osmia bicornis*](https://doi.org/10.1002/ieam.4489).
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

- Play using only the keyboard: select a scenario/species, navigate, forage, end days and restart.
- Open help during a run; verify background controls cannot act, focus stays inside the dialog, Escape closes it and focus returns to the invoking button.
- Check menu, map, controls, comparisons and results at 390×844, 768×1024 and 1366×768, plus 200% zoom. All content must remain reachable without horizontal page overflow; wide data tables may scroll within their container.
- Repeat the same setup and action sequence; verify matching outcomes. Change only treatment and verify that the intended environmental factor changes.
- Finish trials, refresh the page and check retained history. Export both CSV files and compare their settings and outcomes with the display.
- Check screen-reader labels, colour-independent symbols and announcements for unavailable actions. Test storage-unavailable feedback without losing in-memory results.
