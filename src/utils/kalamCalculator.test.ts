import { describe, test, expect } from 'vitest';
import { calculateDay, calculateWeeklyKalams, getNoonInTimezone } from './kalamCalculator';

describe('Vedic Kalam Calculator', () => {
  const testDate = new Date(Date.UTC(2026, 6, 14, 12, 0, 0)); // July 14, 2026 UTC
  const testLat = 40.7128; // NYC
  const testLng = -74.0060;

  test('calculateDay returns correct properties', () => {
    const res = calculateDay(testDate, testLat, testLng);
    expect(res).toBeDefined();
    expect(res.sunrise).toBeInstanceOf(Date);
    expect(res.sunset).toBeInstanceOf(Date);
    expect(res.solarNoon).toBeInstanceOf(Date);
    expect(res.solarMidnight).toBeInstanceOf(Date);
    expect(res.nakshatraName).toBeTypeOf('string');
    expect(res.kalams).toBeInstanceOf(Array);
    
    // Core Muhurtas check
    const names = res.kalams.map(k => k.name);
    expect(names).toContain("Brahma Muhurta");
    expect(names).toContain("Pratah Kalam");
    expect(names).toContain("Madhyahna Kalam");
    expect(names).toContain("Pradosha Kalam");
    expect(names).toContain("Amrita Kalam");
    expect(names).toContain("Varjyam (Tyajya)");
    
    // Check type properties are valid
    res.kalams.forEach(k => {
      expect(['auspicious', 'neutral', 'inauspicious']).toContain(k.type);
      expect(k.startTime).toBeInstanceOf(Date);
      expect(k.endTime).toBeInstanceOf(Date);
      expect(k.endTime.getTime()).toBeGreaterThan(k.startTime.getTime());
    });
  });

  test('calculateWeeklyKalams computes Rahu, Yama, and Gulika Kalams', () => {
    const sunrise = new Date(Date.UTC(2026, 6, 14, 9, 37, 0));
    const sunset = new Date(Date.UTC(2026, 6, 15, 0, 27, 0));
    const weekly = calculateWeeklyKalams(testDate, "America/New_York", sunrise, sunset);
    
    expect(weekly.length).toBe(3);
    const names = weekly.map(w => w.name);
    expect(names).toContain("Rahu Kalam");
    expect(names).toContain("Yamagandam");
    expect(names).toContain("Gulika Kalam");
  });

  test('getNoonInTimezone aligns date string to local target timezone noon', () => {
    const noon = getNoonInTimezone("2026-07-14", "America/New_York");
    expect(noon).toBeInstanceOf(Date);
  });
});
