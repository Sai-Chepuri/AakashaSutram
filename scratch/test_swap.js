import * as SunCalc from 'suncalc';

const date = new Date("2026-07-14T16:00:00Z"); // Noon NY
const lat = 40.7128;
const lng = -74.0060;

// Correct order: lat, lng
const timesCorrect = SunCalc.getTimes(date, lat, lng);
console.log("Correct order (lat, lng):", timesCorrect.sunrise?.toISOString(), timesCorrect.sunset?.toISOString());

// Swapped order: lng, lat
const timesSwapped = SunCalc.getTimes(date, lng, lat);
console.log("Swapped order (lng, lat):", timesSwapped.sunrise?.toISOString(), timesSwapped.sunset?.toISOString());
