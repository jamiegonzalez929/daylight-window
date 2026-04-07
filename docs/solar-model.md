# Solar Model Notes

## Overview

Daylight Window uses the NOAA-style solar position approximation for equation of time, declination, solar noon, and sunrise/sunset hour angle.

## Inputs

- Latitude in decimal degrees
- Longitude in decimal degrees
- UTC calendar date
- An IANA timezone string for display formatting

## Core formulas

For a given day of year `N`, the model computes:

- fractional year angle `gamma`
- equation of time in minutes
- solar declination in radians
- solar noon in UTC minutes
- sunrise and sunset from the standard civil zenith of `90.833°`

The hour-angle branch handles three cases:

- normal sunrise and sunset
- polar night
- midnight sun

## Why this model

This approach is lightweight, deterministic, and accurate enough for a planning tool or comparative visualization. It avoids external services and does not require a large astronomy library.

## Known tradeoffs

- Results are approximate and can differ from observatory-grade data by a few minutes.
- Terrain, elevation, and unusual atmospheric conditions are not modeled.
- The app delegates timezone display to the browser's `Intl.DateTimeFormat` support.
