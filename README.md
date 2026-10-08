# Pollinator Hex: Ecology & Evolution

<p align="center">
  <img src="pollinator_hex.svg" alt="Pollinator Hex" width="400">
</p>

  <h3>Interactive Ecological Simulation for Biosciences Undergraduates</h3>
</div>

## Overview

**Pollinator Hex** is a turn-based strategy simulation designed for second-year biosciences students. Players assume the role of a pollinator species (Bumblebee, Solitary Bee, or Hoverfly) and must navigate a fragmented, semi-realistic landscape to survive a 15 'day' season.

The core learning focus involve understanding:
*   **Evolutionary Trade-offs:** Energy expenditure vs. resource gain.
*   **Foraging Strategies:** Central-place foraging (bees) vs. wandering (flies).
*   **Landscape Ecology:** The impact of habitat fragmentation, roads, and agricultural intensification.

## Game link:

https://entomology-hau.github.io/pollinator-hex/

## Gameplay Mechanics

### 1. Species Selection
Each species has distinct physiological traits:
*   **Bumblebee:** High energy capacity, cold tolerant, social (needs massive resources for colony).
*   **Solitary Bee:** Efficient, short-range, central-place forager.
*   **Hoverfly:** Mimic, highly mobile, generalist. Larvae provide bio-control services.

### 2. The Landscape
The map is a procedurally generated hexagonal grid containing:
*   **Meadows/Forests:** Safe, moderate resources.
*   **Crops:** High yield ("Sugar Rush" energy bonus) but high pesticide risk.
*   **Urban/Roads:** Resource-poor, high toxicity or collision risk.
*   **Water:** Provides hydration (energy boost + detox) but no food.

### 3. Survival Logic
*   **Energy Budget:** Movement and foraging cost energy. Resting recovers it. Running out means death.
*   **Toxicity:** Accumulates from pesticide exposure. Reaching the threshold is lethal. Sub-lethal effects (>50%) cause movement lethargy and foraging confusion.
*   **Resource Depletion:** Flowers take **3 days** to replenish nectar after being visited.

## Installation & Development

This project uses **React**, **Vite**, and **TypeScript**.

## Deployment

The project is configured for automatic deployment to **GitHub Pages** via GitHub Actions.
*   Push to `main` triggers a build.
*   The site is served from the `gh-pages` branch.

---

*Designed for the Insect Ecology & Evolution Module for Harper Adams University Zoology Undergraduates.*
