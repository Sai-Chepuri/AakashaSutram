import * as SunCalc from 'suncalc';

const date = new Date("2026-07-14T16:00:00Z"); // Noon NY
const lat = 40.7128;
const lng = -74.0060;

const times = SunCalc.getTimes(date, lat, lng);

console.log("Input Date:", date.toISOString());
console.log("Calculated Sunrise (UTC):", times.sunrise?.toISOString());
console.log("Calculated Sunset (UTC):", times.sunset?.toISOString());

// Format in NY timezone
console.log("Formatted Sunrise (NY):", times.sunrise?.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
console.log("Formatted Sunset (NY):", times.sunset?.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }));
