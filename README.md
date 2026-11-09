# Pollinator Hex

A turn-based ecology teaching game for Harper Adams University biosciences students. Choose a simplified bumblebee, solitary bee or adult hoverfly, explore a hex landscape and balance resource collection against energy costs and hazards over 15 turns called “days”.

[Play Pollinator Hex](https://entomology-hau.github.io/pollinator-hex/)

## Playing

- Select a pollinator card. Click or tap a reachable hex to fly there.
- Keyboard: Tab into the map; W/S explores up/down, Q/A upper/lower left and E/D upper/lower right. Arrow keys also move focus; Home selects the current position. Enter/Space flies to the focused tile. Tab then reaches feeding, rest and help controls.
- Read the focused/hovered tile's movement preview. The quoted flight cost excludes possible collision damage. Unknown terrain remains hidden until explored.
- Collect resources on flowering tiles. They replenish after three days. Road, water and shelter tiles contain no forage.
- Rest to end the day: up to 40 energy at the shelter or 20 outside it. Resting outside carries a 15% predation risk.
- Each traversed road hex has a 25% collision chance, costing 35 energy. Water provides no energy or detoxification.
- Landing on or feeding in exposed crop/garden tiles increases toxicity. Above half the pollinator's limit, movement costs rise by 50% and yield falls by 25%. Reaching the limit ends the run.
- Field notes and the latest action remain available at every screen size. The field guide is a modal: background game controls cannot be used while it is open.

## Teaching and model assumptions

Use the game to discuss foraging choices, resource depletion, exposure and uncertainty. The three pollinators are functional types with different numerical settings, not calibrated representations of named species.

Energy, flight range, toxicity, recovery, hazard probabilities and reproductive conversions are illustrative game values. Meadow and woodland share a baseline quality distribution. Crop and garden exposure settings describe this scenario rather than all real habitats. Nectar, pollen and reproduction are simplified; collected resources are not yet carried back to a nest. All pollinators share the central shelter rule. Adult hoverfly floral feeding does not earn a larval aphid-predation bonus.

The end screen reports **day reached**, resources collected and an **illustrative reproductive score**, not predicted workers, eggs or surviving offspring. The retained score formulas are `floor(resources × 0.6)` for bumblebees, `floor(resources / 15)` for solitary bees, and `floor(resources / 3)` for hoverflies. Compare scores within the same functional type. Rest currently adds energy without drawing on food stores, so surviving without feeding is possible but yields zero reproductive points. A day is a game turn, not a literal activity budget.

New runs randomise landscape, weather and hazards. A single difference between runs does not establish a species or strategy effect. Seeded scenarios, resource delivery, distinct life histories and data export are planned later improvements.

Research for discussion (not parameter calibration):

- van Rijn, Kooijman & Wäckers (2013), [The contribution of floral resources and honeydew to the performance of predatory hoverflies](https://doi.org/10.1016/j.biocontrol.2013.06.014).
- Tew et al. (2021), [Quantifying nectar production by flowering plants in urban and rural landscapes](https://doi.org/10.1111/1365-2745.13598).

## Development

Requires Node.js 22 or later and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

The app uses React, TypeScript and Vite. Tailwind styles are compiled locally during the build; no runtime styling CDN or API key is required. The Vite base path is `/pollinator-hex/` for GitHub Pages.

Game rules live in `game/rules.ts`; state transitions accept an injectable random function for deterministic tests. UI components call these rules rather than maintaining separate action-validity logic. Tests cover hazards along routes, invalid actions, energy and toxicity, resource depletion, water and hoverfly behaviour.

Pull requests run tests and a production build. Pushes to `main` or `master` run the same checks before deploying `dist` to `gh-pages`.

### Manual release checks

- Play with keyboard only: choose a pollinator, navigate the map, fly, forage, end days and restart.
- Open help during a run; confirm background controls cannot act, Tab stays in the dialog, Escape closes it and focus returns to the help button.
- Check the menu, map, controls, feedback and results at 390×844, 768×1024 and 1366×768, plus 200% zoom. There should be no inaccessible content or horizontal page overflow.
- Check screen-reader labels, colour-independent terrain symbols and announcements for unavailable actions.
