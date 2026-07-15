import { describe, test, expect } from 'vitest';
import { CITIES, getTimezoneFromCoords } from './cities';

describe('Cities Utilities', () => {
  test('CITIES database has expected properties', () => {
    expect(CITIES.length).toBeGreaterThan(0);
    const nyc = CITIES.find(c => c.name.includes("New York"));
    expect(nyc).toBeDefined();
    expect(nyc?.timezone).toBe("America/New_York");
    expect(nyc?.lat).toBeCloseTo(40.7128, 4);
    expect(nyc?.lng).toBeCloseTo(-74.0060, 4);
  });

  test('getTimezoneFromCoords resolves Indian coords to Asia/Kolkata', () => {
    // New Delhi
    expect(getTimezoneFromCoords(28.6139, 77.2090)).toBe("Asia/Kolkata");
    // Mumbai
    expect(getTimezoneFromCoords(19.0760, 72.8777)).toBe("Asia/Kolkata");
  });

  test('getTimezoneFromCoords approximates world offsets', () => {
    // London
    expect(getTimezoneFromCoords(51.5074, -0.1278)).toBe("Europe/London");
    // Singapore (offset 8 hours -> 8 * 15 = 120 longitude, geographically rounded to case 7 = Asia/Bangkok)
    expect(getTimezoneFromCoords(1.3521, 103.8198)).toBe("Asia/Bangkok");
  });
});
