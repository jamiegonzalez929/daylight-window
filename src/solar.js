const ZENITH_DEGREES = 90.833;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

export function toUtcDate(dateLike) {
  const date = new Date(dateLike);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function dayOfYear(dateLike) {
  const date = toUtcDate(dateLike);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

function equationOfTimeAndDeclination(dateLike) {
  const date = toUtcDate(dateLike);
  const yearDays = daysInYear(date.getUTCFullYear());
  const gamma = (2 * Math.PI / yearDays) * (dayOfYear(date) - 1);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return { equationOfTime, declination };
}

function normalizeMinutes(minutes) {
  const wrapped = minutes % 1440;
  return wrapped < 0 ? wrapped + 1440 : wrapped;
}

export function solarSummary({ date, latitude, longitude }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError("latitude and longitude must be finite numbers");
  }
  if (latitude < -90 || latitude > 90) {
    throw new RangeError("latitude must be between -90 and 90");
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError("longitude must be between -180 and 180");
  }

  const utcDate = toUtcDate(date);
  const { equationOfTime, declination } = equationOfTimeAndDeclination(utcDate);
  const latitudeRadians = latitude * DEGREES_TO_RADIANS;
  const zenithRadians = ZENITH_DEGREES * DEGREES_TO_RADIANS;
  const hourAngleCosine =
    Math.cos(zenithRadians) / (Math.cos(latitudeRadians) * Math.cos(declination)) -
    Math.tan(latitudeRadians) * Math.tan(declination);

  const solarNoonUtcMinutes = 720 - 4 * longitude - equationOfTime;

  if (hourAngleCosine >= 1) {
    return {
      date: utcDate,
      latitude,
      longitude,
      solarNoonUtcMinutes: normalizeMinutes(solarNoonUtcMinutes),
      sunriseUtcMinutes: null,
      sunsetUtcMinutes: null,
      daylightMinutes: 0,
      state: "polar-night"
    };
  }

  if (hourAngleCosine <= -1) {
    return {
      date: utcDate,
      latitude,
      longitude,
      solarNoonUtcMinutes: normalizeMinutes(solarNoonUtcMinutes),
      sunriseUtcMinutes: null,
      sunsetUtcMinutes: null,
      daylightMinutes: 1440,
      state: "midnight-sun"
    };
  }

  const hourAngleDegrees = Math.acos(hourAngleCosine) * RADIANS_TO_DEGREES;
  const sunriseUtcMinutes = solarNoonUtcMinutes - 4 * hourAngleDegrees;
  const sunsetUtcMinutes = solarNoonUtcMinutes + 4 * hourAngleDegrees;

  return {
    date: utcDate,
    latitude,
    longitude,
    solarNoonUtcMinutes: normalizeMinutes(solarNoonUtcMinutes),
    sunriseUtcMinutes: normalizeMinutes(sunriseUtcMinutes),
    sunsetUtcMinutes: normalizeMinutes(sunsetUtcMinutes),
    daylightMinutes: Math.round(8 * hourAngleDegrees),
    state: "normal"
  };
}

export function yearlyDaylightSeries({ year, latitude, longitude }) {
  const series = [];
  const totalDays = daysInYear(year);
  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(Date.UTC(year, 0, day));
    const summary = solarSummary({ date, latitude, longitude });
    series.push({
      dayOfYear: day,
      date,
      daylightMinutes: summary.daylightMinutes,
      state: summary.state
    });
  }
  return series;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${String(remainder).padStart(2, "0")}m`;
}

export function formatClockTime(dateLike, utcMinutes, timeZone) {
  if (utcMinutes == null) {
    return "No sunrise/sunset";
  }
  const date = toUtcDate(dateLike);
  const timestamp = date.getTime() + utcMinutes * 60000;
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone
    }).format(new Date(timestamp));
  } catch (error) {
    if (error instanceof RangeError) {
      return "Invalid timezone";
    }
    throw error;
  }
}
