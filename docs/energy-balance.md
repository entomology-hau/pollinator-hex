# Energy balance checks

Model 3.2 returned to the original activity-and-rest loop; model 3.4 retains that energy balance. The main objective is reproductive output. Energy limits how much collecting and travelling a pollinator can do before it needs to rest; survival alone is not a high score.

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

Model 3.3 calibrated bee reproductive allocation; model 3.4 increases both bee pollen allocations by 20%. Each underlying resource unit now represents 18 mg pollen-equivalent for bumblebee colony support or 1.5 mg for solitary-bee nest provisioning. The underlying harvest and all energy, movement, cooldown and hazard rules retain their model 3.2 values. The offspring requirements remain 60 mg per worker and 65 mg per nest cell. Hoverfly output and the aphid bonus are unchanged.

The calibration uses the strongest productive seasons found in a search of 72 strategies across 10 landscape seeds and all six scenario/condition combinations. Strategies knew the whole map, avoided roads, reserved energy for safe shelter, and kept toxicity below impairment. These are high-output examples, not proven maxima or expected student outcomes.

| Pollinator | Underlying resources in calibration run | Model 3.4 reproductive resources | Model 3.3 output | Model 3.4 output |
| --- | ---: | ---: | ---: | ---: |
| Bumblebee | 1,227 | 22,086 mg pollen-equivalent | 306 workers | 368 workers |
| Solitary bee | 1,605 | 2,407.5 mg pollen-equivalent | 30 nest cells | 37 nest cells |
| Hoverfly | 1,609 | 1,609 resource units | 536 eggs | 536 eggs |

The bumblebee and hoverfly examples use `hau-ecology-01`; the solitary-bee example uses `output-estimate-6`. All use the reduced-pesticide treatment and complete 15 days. Replaying these and the default-seed flower-strip controls in model 3.4 preserves every daily energy, collection and toxicity trace. The controls now produce 234 workers, 30 nest cells and 448 eggs. These outputs are not hard caps; a different route or landscape can produce more. The allocation factors compress reproductive resource support and do not describe a measured pollen load per flight.

Keep model 3.4 results separate from earlier versions when comparing class outputs. New screen totals and exports use the scaled reproductive quantities; saved older results are left unchanged.

Run `node --import tsx --test tests/energy-balance.test.ts`. The six tests cover the bounded collecting route and cautious versus inactive seasons. Existing rules tests separately cover rest capacity limits, exposed-night risks, crop feeding, flower recovery, depletion, exhaustion, hazards and reproductive conversions.
