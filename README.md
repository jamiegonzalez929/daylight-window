# Daylight Window

Daylight Window is a small browser-based solar planner that shows how sunrise, sunset, and total daylight shift through the year for a chosen location.

Live demo: https://jamiegonzalez929.github.io/daylight-window/

## Why it exists

I wanted a quick way to compare annual daylight patterns across places without relying on an API, a weather service, or a heavyweight mapping stack. This project keeps the problem tight: given latitude, longitude, a timezone, and a date, it computes a useful local daylight view entirely in the browser.

## Features

- Annual daylight curve for any year from 1900 to 2100
- Sunrise, solar noon, sunset, and total daylight cards for a selected date
- Preset cities plus custom latitude, longitude, timezone, and label
- Shareable URL state via query parameters
- Polar day and polar night handling for extreme latitudes
- Zero third-party runtime dependencies

## Setup

Requirements:

- Node.js 20+ for tests
- Python 3 for a simple local static server

Install steps:

```bash
npm install
```

There are no package dependencies, so this just creates a lockfile if you want one locally.

## How to run

```bash
npm start
```

Then open `http://localhost:4173`.

## How to test

```bash
npm test
```

## Example usage

1. Start the local server.
2. Open the app in a browser.
3. Pick `Reykjavik, Iceland` or enter your own coordinates.
4. Change the focus date to compare a summer and winter day.
5. Copy the URL if you want to share the current view.

You can also open the live GitHub Pages deployment once it is published.

## Limitations

- The model uses standard NOAA sunrise/sunset approximations rather than a full astronomical ephemeris.
- Timezone selection is manual for custom coordinates.
- The chart focuses on daylight duration, not twilight bands or solar elevation curves.

## Next ideas

- Add twilight phases and golden-hour overlays
- Support CSV export for a generated yearly series
- Add direct chart hover and click interactions for day selection

## Project structure

- `index.html`: static app shell
- `styles.css`: visual design and responsive layout
- `src/solar.js`: calculation engine shared by browser code and tests
- `src/app.js`: UI rendering and URL state management
- `test/solar.test.js`: Node test suite
- `docs/solar-model.md`: notes on formulas and implementation choices
