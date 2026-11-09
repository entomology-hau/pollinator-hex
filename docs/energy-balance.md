# Energy balance checks

Model 3.2 returns to the original activity-and-rest loop. The main objective is reproductive output. Energy limits how much collecting and travelling a pollinator can do before it needs to rest; survival alone is not a high score.

## Balance changes

| Parameter | Original game | Model 3.1 | Model 3.2 |
| --- | ---: | ---: | ---: |
| Bumblebee / solitary bee / hoverfly flight cost per hex | 10 / 5 / 4 | 7 / 4 / 3 | 10 / 5 / 4 |
| Feeding energy per harvested resource | 0.5 | 4 | 0.5 |
| Additional feeding energy in flowering crops | 5 | 0 | 5 |
| Sheltered overnight change | +40 | −12 / −8 / −8 | +30 |
| Exposed overnight change, if survived | +20 | −12 / −8 / −8 | +15 |
| Days before a used patch recovers | 3 | 1 | 3 |
| Rain: flight multiplier / resource multiplier | 2 / 0.2 | 1.5 / 0.6 | 1.5 / 0.6 |

Recovery is capped at the pollinator's maximum energy. The original water-energy loophole and adult-hoverfly aphid-feeding claim remain removed. The aphid habitat bonus only affects reproductive resources.

On a sunny 80-quality meadow, a bumblebee harvests 12 resources. Model 3.1 gave 43 net energy from that forage before the capacity limit. Model 3.2 gives 1. Flying to another meadow and collecting there therefore spends reserves rather than repeatedly refilling them.

Flowering crops retain their original small energy bonus and high harvest. Rich crops can offset a short flight, particularly for hoverflies; they are not an unlimited energy source because collection depletes each patch for three days, and exposed crops may accumulate toxicity.

## Behaviour checks

The checks now distinguish cautious, productive and inactive play instead of treating universal survival as the balance target.

A controlled sunny route visits six connected 80-quality meadows, then returns six hexes to the nest. It isolates energy from roads, pesticides and night risk.

| Pollinator | Starting energy | After collecting six flowers | After returning home | After one sheltered rest |
| --- | ---: | ---: | ---: | ---: |
| Bumblebee | 150 | 96 | 36 | 66 |
| Solitary bee | 80 | 59 | 29 | 59 |
| Hoverfly | 100 | 70 | 46 | 76 |

Every move-and-forage step on this route reduces energy. Extra return travel earns no resources, and one night's recovery does not erase the cost of the long trip. A player must choose between another collecting trip and spending a turn recovering.

A cautious routine visits the two visible, pesticide-free flowers beside the nest whenever they have recovered, then returns to shelter. On other days it rests. Across the default seed plus 19 named seeds, every species and every scenario/condition combination completes the 15-day season. The routine makes only ten forage visits because of the three-day recovery interval. It demonstrates that sensible play remains viable, not an expected success rate for students.

A pollinator that rests at the nest for the entire season survives but collects no resources and gains no reproductive output. Survival without collecting is therefore not equivalent to success.

## Reproduction and reproducibility

Resource-to-offspring conversions and the hoverfly aphid bonus are unchanged. Keep model 3.2 results separate from earlier versions when comparing class outputs.

Run `node --import tsx --test tests/energy-balance.test.ts`. The six tests cover the bounded collecting route and cautious versus inactive seasons. Existing rules tests separately cover rest capacity limits, exposed-night risks, crop feeding, flower recovery, depletion, exhaustion, hazards and reproductive conversions.
