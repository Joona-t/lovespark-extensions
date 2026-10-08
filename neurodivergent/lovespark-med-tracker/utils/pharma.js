import { MED_TYPES } from './constants.js';

/**
 * Returns estimated blood concentration (0-1) at minutesAfterDose
 * for a given medication type. NOT medical advice.
 */
export function getConcentration(medTypeId, minutesAfterDose) {
  const config = MED_TYPES.find(t => t.id === medTypeId);
  if (!config || !config.onset || !config.duration) return 0;

  const t = minutesAfterDose;
  if (t < 0 || t > config.duration) return 0;

  if (medTypeId === 'stimulant_ir') {
    // Bell curve: peak at config.peak, width based on duration
    const sigma = config.duration / 4;
    return Math.exp(-0.5 * ((t - config.peak) / sigma) ** 2);
  }

  if (medTypeId === 'stimulant_xr') {
    // Trapezoidal: ramp up → plateau → taper
    if (t < config.onset) return t / config.onset;
    if (t < config.peak) return 1.0;
    return Math.max(0, 1.0 - (t - config.peak) / (config.duration - config.peak));
  }

  if (medTypeId === 'non_stimulant') {
    // Flat active bar with soft onset
    if (t < config.onset) return t / config.onset;
    return 1.0;
  }

  return 0;
}

/**
 * Returns the current status message based on concentration level.
 */
export function getStatusMessage(concentration) {
  if (concentration >= 0.8) return "Peak focus window — great time for deep work 🧠";
  if (concentration >= 0.5) return "Meds are active — you're in a good window ✨";
  if (concentration >= 0.2) return "Wearing off — be kind to yourself 💖";
  if (concentration > 0) return "Tapering — low effect right now 🌙";
  return '';
}

/**
 * Generate curve points for canvas rendering.
 * Returns array of {x, y} where x is 0-1 (time proportion) and y is 0-1 (concentration).
 */
export function getCurvePoints(medTypeId, doseTimestamp, startHour, endHour, numPoints) {
  const points = [];
  const totalMinutes = (endHour - startHour) * 60;
  const doseDate = new Date(doseTimestamp);
  const doseMinuteOfDay = doseDate.getHours() * 60 + doseDate.getMinutes();
  const startMinute = startHour * 60;

  for (let i = 0; i <= numPoints; i++) {
    const minuteOfDay = startMinute + (totalMinutes * i / numPoints);
    const minutesAfterDose = minuteOfDay - doseMinuteOfDay;
    const concentration = getConcentration(medTypeId, minutesAfterDose);
    points.push({
      x: i / numPoints,
      y: concentration,
    });
  }

  return points;
}
