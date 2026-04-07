import test from "node:test";
import assert from "node:assert/strict";

import {
  dayOfYear,
  formatDuration,
  isLeapYear,
  solarSummary,
  yearlyDaylightSeries
} from "../src/solar.js";

test("leap year detection and day-of-year stay correct", () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2100), false);
  assert.equal(dayOfYear(new Date(Date.UTC(2024, 1, 29))), 60);
});

test("equatorial daylight stays close to 12 hours near the equinox", () => {
  const summary = solarSummary({
    date: new Date(Date.UTC(2026, 2, 20)),
    latitude: 0,
    longitude: 0
  });
  assert.equal(summary.state, "normal");
  assert.ok(Math.abs(summary.daylightMinutes - 726) <= 10);
});

test("high northern latitudes show longer days in June than December", () => {
  const june = solarSummary({
    date: new Date(Date.UTC(2026, 5, 21)),
    latitude: 64.1466,
    longitude: -21.9426
  });
  const december = solarSummary({
    date: new Date(Date.UTC(2026, 11, 21)),
    latitude: 64.1466,
    longitude: -21.9426
  });
  assert.ok(june.daylightMinutes > december.daylightMinutes);
  assert.ok(june.daylightMinutes > 1200);
  assert.ok(december.daylightMinutes < 300);
});

test("polar day and polar night are detected", () => {
  const polarDay = solarSummary({
    date: new Date(Date.UTC(2026, 5, 21)),
    latitude: 78.2232,
    longitude: 15.6469
  });
  const polarNight = solarSummary({
    date: new Date(Date.UTC(2026, 11, 21)),
    latitude: 78.2232,
    longitude: 15.6469
  });
  assert.equal(polarDay.state, "midnight-sun");
  assert.equal(polarDay.daylightMinutes, 1440);
  assert.equal(polarNight.state, "polar-night");
  assert.equal(polarNight.daylightMinutes, 0);
});

test("yearly series length matches the selected year", () => {
  assert.equal(yearlyDaylightSeries({ year: 2025, latitude: 40.6782, longitude: -73.9442 }).length, 365);
  assert.equal(yearlyDaylightSeries({ year: 2024, latitude: 40.6782, longitude: -73.9442 }).length, 366);
});

test("duration formatting is human readable", () => {
  assert.equal(formatDuration(754), "12h 34m");
});

test("invalid coordinates are rejected", () => {
  assert.throws(
    () => solarSummary({ date: new Date(Date.UTC(2026, 0, 1)), latitude: Number.NaN, longitude: 0 }),
    /finite numbers/
  );
});
