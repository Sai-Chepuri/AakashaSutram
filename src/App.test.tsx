import { describe, test, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
    })
  ),
};
vi.stubGlobal('navigator', { geolocation: mockGeolocation });

// Mock window scroll
vi.stubGlobal('scrollY', 0);

// Mock global fetch to return suggestions and timezone correctly
const mockSuggestionsResponse = [
  {
    display_name: "New Delhi, Delhi, India",
    lat: "28.6139",
    lon: "77.2090",
    address: {
      city: "New Delhi",
      state: "Delhi",
      country: "India"
    }
  }
];

const mockTimezoneResponse = {
  timeZone: "Asia/Kolkata"
};

beforeAll(() => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('nominatim.openstreetmap.org/search')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSuggestionsResponse)
      });
    }
    if (url.includes('timeapi.io/api/TimeZone/coordinate')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTimezoneResponse)
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  }));
});

describe('AakashaSutram UI Integration', () => {
  test('renders Welcome setup screen initially', () => {
    render(<App />);
    expect(screen.getByText('AakashaSutram')).toBeDefined();
    expect(screen.getByText('Namaste')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter location')).toBeDefined();
  });

  test('location input suggestion list and insights transition', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Enter location');
    
    // Type New Delhi
    fireEvent.change(input, { target: { value: 'New Delhi' } });
    
    // Wait for autocomplete suggestions to show up (predefined list matches immediately)
    await waitFor(() => {
      expect(screen.getByText('New Delhi, India')).toBeDefined();
    });

    // Select suggestion
    fireEvent.click(screen.getByText('New Delhi, India'));
    
    // Click Insights
    const insightsBtn = screen.getByText('Insights');
    fireEvent.click(insightsBtn);

    // Verify it transitions to Dashboard screen
    await waitFor(() => {
      expect(screen.getByText('Daily Muhurtas')).toBeDefined();
      expect(screen.getByText(/Active Nakshatra:/i)).toBeDefined();
    });
  });
});
