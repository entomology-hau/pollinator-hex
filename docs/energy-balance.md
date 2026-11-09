# Energy balance checks

Model 3.1 makes regular feeding a viable way to complete the 15-day season. Daily maintenance remains 12, 8 and 8 energy for bumblebees, solitary bees and hoverflies. Base flight costs are now 7, 4 and 3 per hex; rain increases these by 50% and retains 60% of floral yield. Flowers replenish each new day.

## Simple classroom routine

Each day, alternate between the visible, pesticide-free starter meadow `(0, -1)` and garden `(1, -1)`, forage once, return to the nest and end the day. There is no exploration, route optimisation or use of hidden information. Both patches are adjacent to the nest and available in every scenario.

The comparison used `hau-ecology-01` plus `class-energy-1` through `class-energy-199`. In model 3.0, depleted patches were skipped until available; all other choices stayed the same. Baseline figures use the flower-strips control condition.

| Pollinator | Model 3.0: completed 15 days | Model 3.1: completed 15 days | Default-seed energy after day 15 |
| --- | ---: | ---: | ---: |
| Bumblebee | 12 / 200 | 200 / 200 | 129.6 / 150 |
| Solitary bee | 49 / 200 | 200 / 200 | 67.2 / 80 |
| Hoverfly | 39 / 200 | 200 / 200 | 68.2 / 100 |

Repeating the model 3.1 routine across all three scenarios and both conditions produced 3,600 completed seasons out of 3,600 runs. A second strategy—choose the highest-quality visible, pesticide-free flower adjacent to the nest each day—also completed all 3,600 runs. These are checks of two safe feeding strategies, not estimates of student success rates: both avoid roads, pesticide exposure and exposed nights.

Weather still reduces reserves. In the alternating routine, the lowest final energy across the 200 seeds was 19.0 for bumblebees, 45.4 for solitary bees and 7.0 for hoverflies. Two adjacent flower visits per day also sustain all three pollinators through a deliberately all-rain season. Foraging twice can therefore compensate for poor weather without adding an action type.

Doing nothing at the nest still causes starvation on day 13 for bumblebees and hoverflies, and day 10 for solitary bees.

## Regression checks

Run `node --import tsx --test tests/energy-balance.test.ts`. The tests exercise the alternating routine with the default seed and 19 named seeds, across every scenario and condition, and the all-rain two-visit routine. To reproduce the wider 200-seed sweep, increase the seed-list length from 19 to 199 in a temporary test copy. Existing rules tests cover starvation without feeding, resource limits, weather, hazards and reproduction.
