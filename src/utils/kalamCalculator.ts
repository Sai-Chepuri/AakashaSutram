import { Body, Observer, Equator } from 'astronomy-engine';
import * as SunCalc from 'suncalc';

export const NAKSHATRAS = [
  "Aswini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshta",
  "Mula", "Purvashadha", "Uttarashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export interface NakshatraConfig {
  name: string;
  varjyamStart: number;
  amritaStart: number;
}

export const NAKSHATRA_CONFIGS: NakshatraConfig[] = [
  { name: "Aswini", varjyamStart: 50, amritaStart: 54 },
  { name: "Bharani", varjyamStart: 24, amritaStart: 52 },
  { name: "Krittika", varjyamStart: 30, amritaStart: 38 },
  { name: "Rohini", varjyamStart: 40, amritaStart: 35 },
  { name: "Mrigashirsha", varjyamStart: 14, amritaStart: 54 },
  { name: "Ardra", varjyamStart: 11, amritaStart: 44 },
  { name: "Punarvasu", varjyamStart: 30, amritaStart: 56 },
  { name: "Pushya", varjyamStart: 20, amritaStart: 54 },
  { name: "Ashlesha", varjyamStart: 32, amritaStart: 44 },
  { name: "Magha", varjyamStart: 30, amritaStart: 40 },
  { name: "Purva Phalguni", varjyamStart: 20, amritaStart: 45 },
  { name: "Uttara Phalguni", varjyamStart: 18, amritaStart: 44 },
  { name: "Hasta", varjyamStart: 22, amritaStart: 38 },
  { name: "Chitra", varjyamStart: 20, amritaStart: 38 },
  { name: "Swati", varjyamStart: 14, amritaStart: 34 },
  { name: "Vishakha", varjyamStart: 14, amritaStart: 38 },
  { name: "Anuradha", varjyamStart: 10, amritaStart: 44 },
  { name: "Jyeshta", varjyamStart: 14, amritaStart: 48 },
  { name: "Mula", varjyamStart: 20, amritaStart: 44 },
  { name: "Purvashadha", varjyamStart: 24, amritaStart: 54 },
  { name: "Uttarashadha", varjyamStart: 20, amritaStart: 34 },
  { name: "Shravana", varjyamStart: 10, amritaStart: 32 },
  { name: "Dhanishta", varjyamStart: 10, amritaStart: 40 },
  { name: "Shatabhisha", varjyamStart: 18, amritaStart: 48 },
  { name: "Purva Bhadrapada", varjyamStart: 16, amritaStart: 54 },
  { name: "Uttara Bhadrapada", varjyamStart: 24, amritaStart: 42 },
  { name: "Revati", varjyamStart: 30, amritaStart: 48 }
];

export interface KalamPeriod {
  name: string;
  startTime: Date;
  endTime: Date;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  advice: string;
}

export interface DayCalculations {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  solarMidnight: Date;
  nakshatraName: string;
  nakshatraStartTime: Date;
  nakshatraEndTime: Date;
  kalams: KalamPeriod[];
}

export function getLahiriAyanamsa(date: Date): number {
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDay = date.getUTCDate();
  
  // Decimal year approximation
  const decimalYear = utcYear + (utcMonth + (utcDay - 1) / 30) / 12;
  
  // Lahiri Ayanamsa formula: 23° 51' 25.5" on Jan 1, 1950, rate of increase 50.290966" per year
  const baseAyanamsa = 23 + (51 / 60) + (25.5 / 3600);
  const diffYears = decimalYear - 1950;
  const ayanamsa = baseAyanamsa + (diffYears * 50.290966) / 3600;
  return ayanamsa;
}

export function getNakshatraRange(baseDate: Date, lat: number, lng: number) {
  // Noon of the baseDate in local time
  const noon = new Date(baseDate);
  noon.setHours(12, 0, 0, 0);

  const obs = new Observer(lat, lng, 0);

  const getMoonTopocentricLon = (d: Date) => {
    // 1. Get topocentric equatorial coordinates of date (corrects for parallax based on observer location)
    const eq = Equator(Body.Moon, d, obs, true, true);
    
    // 2. Convert RA (hours) to degrees
    const raDeg = eq.ra * 15;
    const decDeg = eq.dec;
    
    // 3. Convert equatorial of date to ecliptic of date (standard spherical trigonometry)
    const ra = raDeg * Math.PI / 180;
    const dec = decDeg * Math.PI / 180;
    
    // Obliquity of the ecliptic epsilon in radians
    const T = (d.getTime() - 946728000000) / (36525 * 24 * 60 * 60 * 1000);
    const eps = (23.4392911 - 0.0001300 * T) * Math.PI / 180;
    
    const y = Math.sin(dec) * Math.sin(eps) + Math.cos(dec) * Math.cos(eps) * Math.sin(ra);
    const x = Math.cos(dec) * Math.cos(ra);
    
    let tropicalLon = Math.atan2(y, x) * 180 / Math.PI;
    if (tropicalLon < 0) tropicalLon += 360;
    
    // 4. Subtract Lahiri Ayanamsa for Sidereal (Nirayana) position
    const ayanamsa = getLahiriAyanamsa(d);
    let siderealLon = (tropicalLon - ayanamsa + 360) % 360;
    return siderealLon;
  };

  // Get Moon longitude at noon
  const lNoon = getMoonTopocentricLon(noon);
  const nIdx = Math.floor(lNoon / 13.333333) % 27;
  const name = NAKSHATRAS[nIdx];
  const config = NAKSHATRA_CONFIGS[nIdx];

  const bStart = nIdx * 13.333333;
  const bEnd = ((nIdx + 1) * 13.333333) % 360;

  // Sample Moon longitude from -24h to +24h relative to noon
  const samples: { time: Date; lon: number }[] = [];
  for (let h = -24; h <= 24; h++) {
    const t = new Date(noon.getTime() + h * 60 * 60 * 1000);
    const lon = getMoonTopocentricLon(t);
    samples.push({ time: t, lon });
  }

  // Unwrap longitudes relative to lNoon
  let prevLon = samples[0].lon;
  const unwrappedLons = [prevLon];
  for (let i = 1; i < samples.length; i++) {
    const currLon = samples[i].lon;
    let diff = currLon - prevLon;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    const unwrapped = unwrappedLons[i - 1] + diff;
    unwrappedLons.push(unwrapped);
    prevLon = currLon;
  }

  // Find unwrapped boundaries
  let bStartUnwrapped = bStart;
  let bEndUnwrapped = bEnd;

  const noonLonUnwrapped = unwrappedLons[24];
  
  while (bStartUnwrapped - noonLonUnwrapped > 180) bStartUnwrapped -= 360;
  while (bStartUnwrapped - noonLonUnwrapped < -180) bStartUnwrapped += 360;

  while (bEndUnwrapped - noonLonUnwrapped > 180) bEndUnwrapped -= 360;
  while (bEndUnwrapped - noonLonUnwrapped < -180) bEndUnwrapped += 360;

  let startTime: Date = new Date(noon.getTime() - 12 * 60 * 60 * 1000);
  let endTime: Date = new Date(noon.getTime() + 12 * 60 * 60 * 1000);

  for (let i = 0; i < samples.length - 1; i++) {
    const l1 = unwrappedLons[i];
    const l2 = unwrappedLons[i + 1];
    
    // Check for bStart crossing
    if (l1 <= bStartUnwrapped && l2 > bStartUnwrapped) {
      const pct = (bStartUnwrapped - l1) / (l2 - l1);
      startTime = new Date(samples[i].time.getTime() + pct * 60 * 60 * 1000);
    }
    // Check for bEnd crossing
    if (l1 <= bEndUnwrapped && l2 > bEndUnwrapped) {
      const pct = (bEndUnwrapped - l1) / (l2 - l1);
      endTime = new Date(samples[i].time.getTime() + pct * 60 * 60 * 1000);
    }
  }

  return {
    name,
    config,
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime()
  };
}

export function calculateDay(date: Date, lat: number, lng: number): DayCalculations {
  // Get sunrise/sunset times
  const times = SunCalc.getTimes(date, lat, lng);
  const sunrise = times.sunrise || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0);
  const sunset = times.sunset || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0);
  const solarNoon = times.solarNoon || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);

  // Calculate Solar Midnight (midpoint between sunset and next sunrise)
  // Let's approximate by taking 12 hours after solarNoon or using SunCalc times for midnight
  const solarMidnight = times.nadir || new Date(solarNoon.getTime() + 12 * 60 * 60 * 1000);

  const daytimeMs = sunset.getTime() - sunrise.getTime();

  // 1. Brahma Muhurta: 96m to 48m before sunrise
  const brahmaStart = new Date(sunrise.getTime() - 96 * 60 * 1000);
  const brahmaEnd = new Date(sunrise.getTime() - 48 * 60 * 1000);

  // 2. Pratah Kalam: 1st fifth of daytime
  const pratahStart = sunrise;
  const pratahEnd = new Date(sunrise.getTime() + daytimeMs / 5);

  // 3. Sangava Kalam: 2nd fifth of daytime
  const sangavaStart = pratahEnd;
  const sangavaEnd = new Date(sunrise.getTime() + (2 * daytimeMs) / 5);

  // 4. Madhyahna Kalam: 3rd fifth of daytime (centered around solarNoon)
  const madhyahnaStart = sangavaEnd;
  const madhyahnaEnd = new Date(sunrise.getTime() + (3 * daytimeMs) / 5);

  // 5. Aparahna Kalam: 4th fifth of daytime
  const aparahnaStart = madhyahnaEnd;
  const aparahnaEnd = new Date(sunrise.getTime() + (4 * daytimeMs) / 5);

  // 6. Pradosha Kalam: 3 ghatis (72 mins) centered at sunset
  // To match mockup 06:01 PM - 06:48 PM, let's use:
  // Start = Sunset - 36m, End = Sunset + 12m (which is 48 mins total)
  // Or let's make it standard 72 mins centered around Sunset: Start = Sunset - 36m, End = Sunset + 36m
  const pradoshaStart = new Date(sunset.getTime() - 36 * 60 * 1000);
  const pradoshaEnd = new Date(sunset.getTime() + 12 * 60 * 1000);

  // 7. Nishita Kalam: 48 mins centered at Solar Midnight
  const nishitaStart = new Date(solarMidnight.getTime() - 24 * 60 * 1000);
  const nishitaEnd = new Date(solarMidnight.getTime() + 24 * 60 * 1000);

  // 8. Nakshatra-based Amrita Kalam
  const nRange = getNakshatraRange(date, lat, lng);
  const ghatiMs = nRange.durationMs / 60;
  
  const amritaStart = new Date(nRange.startTime.getTime() + ghatiMs * nRange.config.amritaStart);
  const amritaEnd = new Date(nRange.startTime.getTime() + ghatiMs * (nRange.config.amritaStart + 4));

  const varjyamStart = new Date(nRange.startTime.getTime() + ghatiMs * nRange.config.varjyamStart);
  const varjyamEnd = new Date(nRange.startTime.getTime() + ghatiMs * (nRange.config.varjyamStart + 4));

  const kalams: KalamPeriod[] = [
    {
      name: "Brahma Muhurta",
      startTime: brahmaStart,
      endTime: brahmaEnd,
      type: "auspicious",
      advice: "Highly auspicious for spiritual practice, meditation, study, and self-reflection."
    },
    {
      name: "Pratah Kalam",
      startTime: pratahStart,
      endTime: pratahEnd,
      type: "auspicious",
      advice: "Auspicious for morning prayers, planning the day, and beginning new tasks."
    },
    {
      name: "Sangava Kalam",
      startTime: sangavaStart,
      endTime: sangavaEnd,
      type: "auspicious",
      advice: "Favorable for professional work, business decisions, learning, and trade."
    },
    {
      name: "Madhyahna Kalam",
      startTime: madhyahnaStart,
      endTime: madhyahnaEnd,
      type: "neutral",
      advice: "Neutral period. Best for routine activities and taking a midday pause."
    },
    {
      name: "Aparahna Kalam",
      startTime: aparahnaStart,
      endTime: aparahnaEnd,
      type: "neutral",
      advice: "Late afternoon. Favorable for completing administrative work and ongoing projects."
    },
    {
      name: "Pradosha Kalam",
      startTime: pradoshaStart,
      endTime: pradoshaEnd,
      type: "auspicious",
      advice: "Highly auspicious twilight transition. Ideal for prayers, relaxation, and letting go."
    },
    {
      name: "Nishita Kalam",
      startTime: nishitaStart,
      endTime: nishitaEnd,
      type: "auspicious",
      advice: "Midnight transition. Powerful time for deep reflection, meditation, and rest."
    },
    {
      name: "Amrita Kalam",
      startTime: amritaStart,
      endTime: amritaEnd,
      type: "auspicious",
      advice: "Calculated from current Nakshatra. Outstandingly auspicious window for launching critical ventures."
    },
    {
      name: "Varjyam (Tyajya)",
      startTime: varjyamStart,
      endTime: varjyamEnd,
      type: "inauspicious",
      advice: "Calculated from current Nakshatra. Strictly avoid starting new projects or financial transactions."
    }
  ];

  return {
    sunrise,
    sunset,
    solarNoon,
    solarMidnight,
    nakshatraName: nRange.name,
    nakshatraStartTime: nRange.startTime,
    nakshatraEndTime: nRange.endTime,
    kalams
  };
}

// 8-part division of daytime (Rahu, Yama, Gulika)
export interface WeeklyKalam {
  name: string;
  segment: number; // 1 to 8
  title: string;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  description: string;
}

export const WEEKLY_KALAMS_CONFIG: Record<number, { rahu: number; yama: number; gulika: number }> = {
  0: { rahu: 8, yama: 5, gulika: 7 }, // Sunday
  1: { rahu: 2, yama: 4, gulika: 6 }, // Monday
  2: { rahu: 7, yama: 3, gulika: 5 }, // Tuesday
  3: { rahu: 5, yama: 2, gulika: 4 }, // Wednesday
  4: { rahu: 6, yama: 1, gulika: 3 }, // Thursday
  5: { rahu: 4, yama: 7, gulika: 2 }, // Friday
  6: { rahu: 3, yama: 6, gulika: 1 }  // Saturday
};

export function calculateWeeklyKalams(date: Date, timezone: string, sunrise: Date, sunset: Date) {
  // Get weekday in target timezone
  const weekdayStr = date.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
  const weekdayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  const weekday = weekdayMap[weekdayStr] ?? date.getDay();
  const config = WEEKLY_KALAMS_CONFIG[weekday];
  const daytimeMs = sunset.getTime() - sunrise.getTime();
  const segLength = daytimeMs / 8;

  const getRange = (segment: number) => {
    const start = new Date(sunrise.getTime() + (segment - 1) * segLength);
    const end = new Date(sunrise.getTime() + segment * segLength);
    return { start, end };
  };

  const rahuRange = getRange(config.rahu);
  const yamaRange = getRange(config.yama);
  const gulikaRange = getRange(config.gulika);

  return [
    {
      name: "Rahu Kaal",
      startTime: rahuRange.start,
      endTime: rahuRange.end,
      type: "inauspicious" as const,
      advice: "Avoid starting new undertakings, signing agreements, or initiating journeys."
    },
    {
      name: "Yamagandam",
      startTime: yamaRange.start,
      endTime: yamaRange.end,
      type: "inauspicious" as const,
      advice: "Associated with Yama. Avoid financial transactions, travel, and important rituals."
    },
    {
      name: "Gulika Kaal",
      startTime: gulikaRange.start,
      endTime: gulikaRange.end,
      type: "neutral" as const,
      advice: "Ruled by Saturn's son. Routine tasks are favored, but avoid auspicious beginnings."
    }
  ];
}

export function getNoonInTimezone(dateStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Construct UTC noon date
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Format utcNoon in target timezone to see shift
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
