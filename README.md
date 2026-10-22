# Free the Tiger

A responsive PixiJS mini game built for a frontend game developer assessment. Discover the secret six-bar sequence in the browser console, open the cage in order, and free the tiger.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

## Setup and commands

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Additional commands:

```bash
npm run typecheck  # TypeScript validation
npm test           # Logic tests
npm run build      # Production build
npm run preview    # Preview the production build
```

## Gameplay

Open bars by clicking or tapping their numbered badges or rails. At the start of every round, a random permutation of 1–6 is intentionally logged to the browser developer console as required by the assessment. Select bars in that exact order. A wrong selection slams every opened bar shut and generates a new sequence. Opening all six frees the tiger; the game resets automatically after the win display.

## Architecture

- `Game` initializes PixiJS, loads assets, and scales the fixed logical stage.
- `GameScene` composes the artwork and owns the round state and async game flow.
- `CageBar` encapsulates each bar, shadow, number, hit area, and GSAP movement.
- `LockMeter` renders the plate-based count and six status pips.
- Small animation and shuffle modules keep Promise-based GSAP flow and Fisher–Yates randomization focused and testable.

The state machine locks all bars during open, reset, and win transitions, preventing rapid input from corrupting progress. Bar and shadow artwork share a container so they always move together.

## Responsive and animation approach

The composition uses the artwork's 1280×720 reference resolution. A root Pixi container is uniformly scaled and centered within the browser viewport, preserving proportions and keeping hit areas attached to the cage on desktop and mobile. Pixi uses device pixel ratio (capped at 2) for a balance of clarity and GPU cost.

GSAP timelines are wrapped in Promises so gameplay reads as a sequential `async`/`await` flow. The three-second win hold uses `gsap.delayedCall`; native timer APIs are not used.

## Technologies

TypeScript, PixiJS 8, GSAP 3, and Vite.
