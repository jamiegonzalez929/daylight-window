import { presets } from "./presets.js";
import {
  dayOfYear,
  formatClockTime,
  formatDuration,
  solarSummary,
  yearlyDaylightSeries
} from "./solar.js";

const svg = document.querySelector("#chart");
const summaryCards = document.querySelector("#summary-cards");
const notes = document.querySelector("#notes");
const dateInput = document.querySelector("#date");
const yearInput = document.querySelector("#year");
const presetSelect = document.querySelector("#preset");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const timezoneInput = document.querySelector("#timezone");
const locationLabel = document.querySelector("#location-label");

for (const preset of presets) {
  const option = document.createElement("option");
  option.value = preset.id;
  option.textContent = preset.label;
  presetSelect.append(option);
}

const today = new Date();
dateInput.value = today.toISOString().slice(0, 10);
yearInput.value = String(today.getUTCFullYear());
presetSelect.value = presets[0].id;
applyPreset(presets[0].id);

function applyPreset(presetId) {
  const preset = presets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }
  latitudeInput.value = String(preset.latitude);
  longitudeInput.value = String(preset.longitude);
  timezoneInput.value = preset.timeZone;
  locationLabel.value = preset.label;
}

function clampYear(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return today.getUTCFullYear();
  }
  return Math.min(2100, Math.max(1900, parsed));
}

function readState() {
  return {
    latitude: Number.parseFloat(latitudeInput.value),
    longitude: Number.parseFloat(longitudeInput.value),
    timeZone: timezoneInput.value.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
    label: locationLabel.value.trim() || "Custom location",
    year: clampYear(yearInput.value),
    date: new Date(dateInput.value + "T00:00:00Z")
  };
}

function syncUrl(state) {
  const url = new URL(window.location.href);
  url.searchParams.set("lat", String(state.latitude));
  url.searchParams.set("lon", String(state.longitude));
  url.searchParams.set("tz", state.timeZone);
  url.searchParams.set("label", state.label);
  url.searchParams.set("date", dateInput.value);
  url.searchParams.set("year", String(state.year));
  window.history.replaceState({}, "", url);
}

function loadUrlState() {
  const url = new URL(window.location.href);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const tz = url.searchParams.get("tz");
  const label = url.searchParams.get("label");
  const date = url.searchParams.get("date");
  const year = url.searchParams.get("year");
  if (lat) latitudeInput.value = lat;
  if (lon) longitudeInput.value = lon;
  if (tz) timezoneInput.value = tz;
  if (label) locationLabel.value = label;
  if (date) dateInput.value = date;
  if (year) yearInput.value = year;
}

function makeCard(title, value, detail) {
  const card = document.createElement("article");
  card.className = "card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const strong = document.createElement("strong");
  strong.textContent = value;
  const p = document.createElement("p");
  p.textContent = detail;
  card.append(heading, strong, p);
  return card;
}

function renderSummary(state, summary) {
  summaryCards.innerHTML = "";
  summaryCards.append(
    makeCard("Sunrise", formatClockTime(state.date, summary.sunriseUtcMinutes, state.timeZone), state.timeZone),
    makeCard("Solar noon", formatClockTime(state.date, summary.solarNoonUtcMinutes, state.timeZone), "Calculated local solar noon"),
    makeCard("Sunset", formatClockTime(state.date, summary.sunsetUtcMinutes, state.timeZone), state.timeZone),
    makeCard("Daylight", formatDuration(summary.daylightMinutes), summary.state === "normal" ? "Civil sunrise/sunset model" : summary.state)
  );
}

function renderNotes(summary) {
  const descriptions = {
    "normal": "Sunrise and sunset use the NOAA civil sunrise/sunset approximation with atmospheric refraction.",
    "polar-night": "The sun does not rise on this date at this latitude.",
    "midnight-sun": "The sun does not set on this date at this latitude."
  };
  notes.textContent = descriptions[summary.state];
}

function renderChart(state, series) {
  const width = 920;
  const height = 360;
  const padding = { top: 24, right: 20, bottom: 40, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxMinutes = 1440;
  const points = series.map((entry) => {
    const x = padding.left + ((entry.dayOfYear - 1) / (series.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (entry.daylightMinutes / maxMinutes) * chartHeight;
    return `${x},${y}`;
  });
  const areaPoints = [
    `${padding.left},${padding.top + chartHeight}`,
    ...points,
    `${padding.left + chartWidth},${padding.top + chartHeight}`
  ];
  const selectedDay = dayOfYear(state.date);
  const selectedX = padding.left + ((selectedDay - 1) / (series.length - 1)) * chartWidth;
  const selectedEntry = series[Math.min(series.length - 1, Math.max(0, selectedDay - 1))];
  const selectedY = padding.top + chartHeight - (selectedEntry.daylightMinutes / maxMinutes) * chartHeight;
  const monthTicks = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="22" class="chart-bg"></rect>
    <g class="grid">
      ${[0, 360, 720, 1080, 1440]
        .map((minutes) => {
          const y = padding.top + chartHeight - (minutes / maxMinutes) * chartHeight;
          return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}"></line>
            <text x="12" y="${y + 4}">${Math.round(minutes / 60)}h</text>`;
        })
        .join("")}
      ${monthTicks
        .map((day, index) => {
          const x = padding.left + (day / (series.length - 1)) * chartWidth;
          return `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartHeight}"></line>
            <text x="${x}" y="${height - 12}" text-anchor="middle">${monthLabels[index]}</text>`;
        })
        .join("")}
    </g>
    <polygon class="area" points="${areaPoints.join(" ")}"></polygon>
    <polyline class="line" points="${points.join(" ")}"></polyline>
    <line class="selected-line" x1="${selectedX}" y1="${padding.top}" x2="${selectedX}" y2="${padding.top + chartHeight}"></line>
    <circle class="selected-dot" cx="${selectedX}" cy="${selectedY}" r="6"></circle>
  `;
}

function render() {
  const state = readState();
  try {
    const summary = solarSummary(state);
    const series = yearlyDaylightSeries(state);
    renderSummary(state, summary);
    renderNotes(summary);
    renderChart(state, series);
    syncUrl(state);
  } catch (error) {
    summaryCards.innerHTML = "";
    svg.innerHTML = "";
    notes.textContent = error instanceof Error ? error.message : "Unable to render this location.";
  }
}

loadUrlState();
render();

presetSelect.addEventListener("change", () => {
  applyPreset(presetSelect.value);
  render();
});

for (const input of [latitudeInput, longitudeInput, timezoneInput, locationLabel, dateInput, yearInput]) {
  input.addEventListener("input", render);
}
