import * as SunCalc from 'suncalc';

const selectedDateStr = "2026-07-14";
const timezone = "America/Toronto";
const lat = 43.6532;
const lng = -79.3832;

// Helper to get noon in timezone
function getNoonInTimezone(dateStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(utcNoon);
  
  const partMap = new Map(tzParts.map(p => [p.type, p.value]));
  const tzYear = Number(partMap.get('year'));
  const tzMonth = Number(partMap.get('month'));
  const tzDay = Number(partMap.get('day'));
  const tzHour = Number(partMap.get('hour'));
  const tzMinute = Number(partMap.get('minute'));
  
  const constructedUTC = Date.UTC(year, month - 1, day, 12, 0, 0);
  const formattedUTC = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0);
  const diffMs = formattedUTC - constructedUTC;
  
  return new Date(constructedUTC - diffMs);
}

const targetNoon = getNoonInTimezone(selectedDateStr, timezone);
const times = SunCalc.getTimes(targetNoon, lat, lng);

console.log("Noon Date (UTC):", targetNoon.toISOString());
console.log("Calculated Sunrise (UTC):", times.sunrise?.toISOString());
console.log("Calculated Sunset (UTC):", times.sunset?.toISOString());

// Format in Toronto timezone
console.log("Formatted Sunrise (Toronto):", times.sunrise?.toLocaleTimeString('en-US', { timeZone: timezone }));
console.log("Formatted Sunset (Toronto):", times.sunset?.toLocaleTimeString('en-US', { timeZone: timezone }));
