export interface City {
  name: string;
  lat: number;
  lng: number;
  timezone: string;
}

export const CITIES: City[] = [
  { name: "New Delhi, India", lat: 28.6139, lng: 77.2090, timezone: "Asia/Kolkata" },
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Bengaluru, India", lat: 12.9716, lng: 77.5946, timezone: "Asia/Kolkata" },
  { name: "Chennai, India", lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
  { name: "Hyderabad, India", lat: 17.3850, lng: 78.4867, timezone: "Asia/Kolkata" },
  { name: "Kolkata, India", lat: 22.5726, lng: 88.3639, timezone: "Asia/Kolkata" },
  { name: "Pune, India", lat: 18.5204, lng: 73.8567, timezone: "Asia/Kolkata" },
  { name: "Ahmedabad, India", lat: 23.0225, lng: 72.5714, timezone: "Asia/Kolkata" },
  { name: "New York, USA", lat: 40.7128, lng: -74.0060, timezone: "America/New_York" },
  { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles" },
  { name: "London, UK", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney" },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore" },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" }
];

export function getTimezoneFromCoords(lat: number, lng: number): string {
  // India is uniform Asia/Kolkata
  if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
    return "Asia/Kolkata";
  }
  
  // Approximate based on longitude hours
  const offsetHours = Math.round(lng / 15);
  
  switch (offsetHours) {
    case 0: return "Europe/London";
    case 1: return "Europe/Paris";
    case 2: return "Europe/Athens";
    case 3: return "Asia/Baghdad";
    case 4: return "Asia/Dubai";
    case 5: return "Asia/Karachi";
    case 6: return "Asia/Dhaka";
    case 7: return "Asia/Bangkok";
    case 8: return "Asia/Singapore";
    case 9: return "Asia/Tokyo";
    case 10: return "Australia/Sydney";
    case 11: return "Pacific/Guadalcanal";
    case 12: return "Pacific/Auckland";
    case -1: return "Atlantic/Azores";
    case -2: return "Atlantic/South_Georgia";
    case -3: return "America/Sao_Paulo";
    case -4: return "America/Halifax";
    case -5: return "America/New_York";
    case -6: return "America/Chicago";
    case -7: return "America/Denver";
    case -8: return "America/Los_Angeles";
    case -9: return "America/Anchorage";
    case -10: return "Pacific/Honolulu";
    case -11: return "Pacific/Pago_Pago";
    case -12: return "Etc/GMT+12";
    default:
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}
