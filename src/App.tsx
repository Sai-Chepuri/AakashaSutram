import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  Navigation, 
  X, 
  Loader2, 
  Compass, 
  Info, 
  Droplet,
  Flame,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon
} from 'lucide-react';
import { calculateDay, calculateWeeklyKalams, getNoonInTimezone } from './utils/kalamCalculator';
import type { DayCalculations, KalamPeriod } from './utils/kalamCalculator';
import { CITIES, getTimezoneFromCoords } from './utils/cities';
import type { City } from './utils/cities';

export default function App() {
  // Navigation State
  // 'welcome' | 'dashboard'
  const [screen, setScreen] = useState<'welcome' | 'dashboard'>('welcome');
  // Bottom Tab Bar active tab
  const [activeTab, setActiveTab] = useState<'home' | 'panchangam' | 'today' | 'calendar' | 'more'>('today');

  // Input states
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]); // Default to Delhi
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  // Geolocation & Autocomplete states
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Calculations result state
  const [calculations, setCalculations] = useState<DayCalculations | null>(null);
  const [weeklyKalams, setWeeklyKalams] = useState<any[]>([]);

  // Detailed Modal state
  const [selectedKalam, setSelectedKalam] = useState<KalamPeriod | null>(null);



  // References for dropdown click-outs
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate whenever selectedCity or selectedDateStr changes
  useEffect(() => {
    if (selectedCity && selectedDateStr) {
      const targetNoon = getNoonInTimezone(selectedDateStr, selectedCity.timezone);
      const calcs = calculateDay(targetNoon, selectedCity.lat, selectedCity.lng);
      setCalculations(calcs);

      const weekly = calculateWeeklyKalams(targetNoon, selectedCity.timezone, calcs.sunrise, calcs.sunset);
      setWeeklyKalams(weekly);
    }
  }, [selectedCity, selectedDateStr]);

  // Handle Geolocation API
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          if (response.ok) {
            const data = await response.json();
            const cityName = data.address.city || data.address.town || data.address.suburb || data.address.state || "Current GPS Location";
            const countryName = data.address.country || "";
            const fullName = `${cityName}${countryName ? ', ' + countryName : ''} (GPS)`;
            
            const gpsCity: City = {
              name: fullName,
              lat,
              lng,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            setSelectedCity(gpsCity);
            setLocationQuery(gpsCity.name);
          } else {
            throw new Error("Reverse geocoding failed");
          }
        } catch (e) {
          // Fallback to anonymous GPS location
          const gpsCity: City = {
            name: `GPS Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
            lat,
            lng,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };
          setSelectedCity(gpsCity);
          setLocationQuery(gpsCity.name);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert(`Could not retrieve location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Handle Search Input & Autocomplete Suggestions
  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);

    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // First, filter local cities list
    const filteredLocal = CITIES.filter(c => 
      c.name.toLowerCase().includes(val.toLowerCase())
    );

    setSuggestions(filteredLocal);

    // Additionally, call Nominatim API for external search
    if (val.trim().length >= 3) {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          const apiCities: City[] = data.map((item: any) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            return {
              name: item.display_name.split(',').slice(0, 3).join(','),
              lat,
              lng: lon,
              timezone: getTimezoneFromCoords(lat, lon)
            };
          });
          
          // Merge local and API results uniquely by name
          const seen = new Set(filteredLocal.map(c => c.name));
          const merged = [...filteredLocal];
          apiCities.forEach(ac => {
            if (!seen.has(ac.name)) {
              seen.add(ac.name);
              merged.push(ac);
            }
          });
          setSuggestions(merged.slice(0, 6));
        }
      } catch (err) {
        console.error("Nominatim search failed: ", err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const selectSuggestion = async (city: City) => {
    let timezone = city.timezone;
    const isPredefined = CITIES.some(c => c.name === city.name && c.lat === city.lat);
    
    if (!isPredefined) {
      try {
        const response = await fetch(
          `https://timeapi.io/api/TimeZone/coordinate?latitude=${city.lat}&longitude=${city.lng}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.timeZone) {
            timezone = data.timeZone;
          }
        }
      } catch (err) {
        console.error("TimeAPI coordinate lookup failed: ", err);
      }
    }

    setSelectedCity({ ...city, timezone });
    setLocationQuery(city.name);
    setSuggestions([]);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDateStr(e.target.value);
    }
  };

  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const newStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(newStr);
  };

  const triggerInsights = async () => {
    // If the user has typed something that is not the currently selected city, resolve it first
    if (locationQuery && locationQuery.trim() !== selectedCity.name) {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const first = data[0];
            const lat = parseFloat(first.lat);
            const lon = parseFloat(first.lon);
            
            // Fetch timezone from TimeAPI.io
            let timezone = getTimezoneFromCoords(lat, lon);
            try {
              const tzRes = await fetch(
                `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`
              );
              if (tzRes.ok) {
                const tzData = await tzRes.json();
                if (tzData && tzData.timeZone) {
                  timezone = tzData.timeZone;
                }
              }
            } catch (tzErr) {
              console.error("TimeAPI lookup failed during submit geocoding: ", tzErr);
            }

            const resolvedCity: City = {
              name: first.display_name.split(',').slice(0, 3).join(','),
              lat,
              lng: lon,
              timezone
            };
            setSelectedCity(resolvedCity);
            setLocationQuery(resolvedCity.name);
            
            // Recalculate immediately for the transition
            const targetNoon = getNoonInTimezone(selectedDateStr, resolvedCity.timezone);
            const calcs = calculateDay(targetNoon, resolvedCity.lat, resolvedCity.lng);
            setCalculations(calcs);
            const weekly = calculateWeeklyKalams(targetNoon, resolvedCity.timezone, calcs.sunrise, calcs.sunset);
            setWeeklyKalams(weekly);
          } else {
            alert(`Could not resolve location: "${locationQuery}". Please select a suggestion from the list or try another name.`);
            setIsSearching(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to auto-resolve typed location:", e);
      } finally {
        setIsSearching(false);
      }
    }
    setScreen('dashboard');
    setActiveTab('today');
  };

  // Format date helper
  const formatDateString = (d: Date) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTimeString = (d: Date) => {
    try {
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: selectedCity.timezone
      });
    } catch (e) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  // Get weekday label
  const getWeekday = (d: Date) => {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Icons mapper for different Kalams
  const getKalamIcon = (name: string) => {
    switch (name) {
      case "Brahma Muhurta":
        return <FlowerIcon className="w-4 h-4" />;
      case "Pratah Kalam":
        return <SunriseIcon className="w-4 h-4" />;
      case "Sangava Kalam":
        return <Sun className="w-4 h-4" />;
      case "Madhyahna Kalam":
        return <Sun className="w-4 h-4" style={{ transform: 'scale(1.2)' }} />;
      case "Aparahna Kalam":
        return <Sun className="w-4 h-4" style={{ opacity: 0.7 }} />;
      case "Pradosha Kalam":
        return <SunsetIcon className="w-4 h-4" />;
      case "Nishita Kalam":
        return <Moon className="w-4 h-4" />;
      case "Amrita Kalam":
        return <Droplet className="w-4 h-4 text-emerald-600" />;
      case "Varjyam (Tyajya)":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "Rahu Kaal":
        return <Moon className="w-4 h-4" />;
      case "Yamagandam":
        return <Flame className="w-4 h-4" />;
      case "Gulika Kaal":
        return <Sun className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getDates = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const today = new Date(y, m - 1, d);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { yesterday, today, tomorrow };
  };
  const { yesterday, today, tomorrow } = getDates();

  const blendedKalams = (() => {
    if (!calculations) return [];
    const priority: Record<string, number> = {
      auspicious: 1,
      neutral: 2,
      inauspicious: 3
    };
    return [...calculations.kalams, ...weeklyKalams].sort((a, b) => {
      const pA = priority[a.type] ?? 2;
      const pB = priority[b.type] ?? 2;
      if (pA !== pB) return pA - pB;
      return a.startTime.getTime() - b.startTime.getTime();
    });
  })();

  return (
    <div className="app-container">
      {/* Header (visible on dashboard screen) */}
      {screen === 'dashboard' && (
        <header className="app-header">
          <button className="header-btn" aria-label="Menu" onClick={() => setScreen('welcome')}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="logo-container">
            <svg viewBox="0 0 100 100" className="app-logo-mark" fill="none" strokeWidth="2.5">
              <path d="M50,15 C45,35 30,45 30,55 C30,67 39,75 50,75 C61,75 70,67 70,55 C70,45 55,35 50,15 Z" />
              <path d="M50,15 C55,35 70,45 70,55 C70,67 61,75 50,75" strokeDasharray="2,2" />
              <circle cx="50" cy="55" r="8" strokeWidth="1.5" />
              <line x1="50" y1="15" x2="50" y2="75" strokeWidth="1" strokeDasharray="1,2" />
            </svg>
            <h1 className="app-title-main title-serif">AakashaSutram</h1>
            <span className="app-subtitle-main">align. awaken. ascend.</span>
          </div>

          <button className="header-btn" aria-label="Notifications" onClick={() => alert("Peaceful alignments loaded.")}>
            <Bell className="w-5 h-5" />
          </button>
        </header>
      )}

      {/* Screen 1: Welcome/Setup */}
      {screen === 'welcome' && (
        <main className="welcome-screen" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div className="logo-container" style={{ paddingTop: '40px', paddingBottom: '10px' }}>
            <svg viewBox="0 0 100 100" className="app-logo-mark" fill="none" strokeWidth="2.5" style={{ width: '48px', height: '48px' }}>
              <path d="M50,15 C45,35 30,45 30,55 C30,67 39,75 50,75 C61,75 70,67 70,55 C70,45 55,35 50,15 Z" />
              <circle cx="50" cy="55" r="8" strokeWidth="1.5" />
            </svg>
            <h1 className="app-title-main title-serif" style={{ fontSize: '36px' }}>AakashaSutram</h1>
            <span className="app-subtitle-main">align. awaken. ascend.</span>
          </div>

          <div className="welcome-bg-card" style={{ backgroundImage: 'url("/bg.jpg")' }}>
            <div className="welcome-bg-overlay"></div>
            
            <div className="welcome-content-container">
              <h2 className="welcome-namaste title-serif">Namaste</h2>
              <p className="welcome-text">
                Welcome to your journey of cosmic alignment and conscious living.
              </p>

              <div className="form-container">
                {/* Geolocation input */}
                <div className="input-group">
                  <div className="input-field-wrapper">
                    <MapPin className="input-icon-left" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Enter location"
                      value={locationQuery}
                      onChange={handleLocationChange}
                    />
                    <button className="gps-btn" onClick={detectLocation} type="button" title="Detect Location">
                      {isLocating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Autocomplete Dropdown */}
                  {(suggestions.length > 0 || isSearching) && (
                    <ul className="suggestions-list" ref={suggestionsRef}>
                      {isSearching && (
                        <li className="suggestion-item" style={{ color: 'var(--color-muted)', cursor: 'default' }}>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching locations...</span>
                        </li>
                      )}
                      {suggestions.map((city, idx) => (
                        <li 
                          key={idx} 
                          className="suggestion-item" 
                          onClick={() => selectSuggestion(city)}
                        >
                          <MapPin className="w-3.5 h-3.5 text-muted" />
                          <span>{city.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Date Picker */}
                <div className="input-group">
                  <div className="input-field-wrapper">
                    <CalendarIcon className="input-icon-left" />
                    <input 
                      type="date" 
                      className="input-field" 
                      onChange={handleDateChange}
                      value={selectedDateStr}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="primary-btn font-sans" onClick={triggerInsights}>
                <span>Insights</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Screen 2: Dashboard */}
      {screen === 'dashboard' && calculations && (
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Date Picker Bar */}
          <div className="date-picker-bar">
            <button className="date-nav-btn" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="date-display-container">
              <div className="date-option" onClick={() => shiftDate(-1)}>
                <span className="date-option-label">Yesterday</span>
                <span className="date-option-value">
                  {yesterday.getDate()} {yesterday.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              
              <div className="date-option active">
                <span className="date-option-label">Today</span>
                <span className="date-option-value">
                  {today.getDate()} {today.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>

              <div className="date-option" onClick={() => shiftDate(1)}>
                <span className="date-option-label">Tomorrow</span>
                <span className="date-option-value">
                  {tomorrow.getDate()} {tomorrow.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
            </div>

            <button className="date-nav-btn" onClick={() => shiftDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Location display notice */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px', fontWeight: 500 }}>
            Calculated for: <span style={{ color: 'var(--color-charcoal)', fontWeight: 600 }}>{selectedCity.name}</span> on <span style={{ color: 'var(--color-charcoal)', fontWeight: 600 }}>{getWeekday(today)}, {formatDateString(today)}</span>
          </div>

          {/* Sunrise/Sunset Cards Grid */}
          <div className="sun-cards-grid">
            {/* Sunrise Card */}
            <div className="sun-card sunrise">
              <div className="sun-card-header">
                <Sun className="sun-card-icon" />
                <span className="sun-card-title">Sunrise</span>
              </div>
              <span className="sun-card-time">{formatTimeString(calculations.sunrise)}</span>
              
              {/* Arched window decoration */}
              <div className="arched-window">
                <div className="arch-bg"></div>
                {/* Layered mountain scenery SVG with vector sun & rays */}
                <svg viewBox="0 0 100 100" className="arch-silhouette" fill="none">
                  <defs>
                    <radialGradient id="sunriseSun" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="40%" stopColor="#FFF4DE" />
                      <stop offset="100%" stopColor="#F5C66C" />
                    </radialGradient>
                    <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Sunburst Rays */}
                  <g stroke="#F5C66C" strokeWidth="0.8" opacity="0.7" strokeLinecap="round">
                    <line x1="50" y1="49" x2="50" y2="32" />
                    <line x1="34" y1="65" x2="18" y2="65" />
                    <line x1="66" y1="65" x2="82" y2="65" />
                    <line x1="38" y1="53" x2="27" y2="42" />
                    <line x1="62" y1="53" x2="73" y2="42" />
                    
                    <line x1="44" y1="50" x2="39" y2="40" strokeWidth="0.5" opacity="0.45" />
                    <line x1="56" y1="50" x2="61" y2="40" strokeWidth="0.5" opacity="0.45" />
                    <line x1="37" y1="57" x2="29" y2="50" strokeWidth="0.5" opacity="0.45" />
                    <line x1="63" y1="57" x2="71" y2="50" strokeWidth="0.5" opacity="0.45" />
                  </g>
                  
                  {/* Sun Disk */}
                  <circle cx="50" cy="65" r="12" fill="url(#sunriseSun)" filter="url(#sunGlow)" />
                  
                  {/* Mountain silhouettes */}
                  <path d="M0,100 L0,75 C20,70 30,85 50,78 C70,72 80,82 100,75 L100,100 Z" fill="#D7D3E8" opacity="0.6" strokeWidth="0" />
                  <path d="M0,100 L0,82 C15,80 25,90 45,84 C65,78 75,88 100,80 L100,100 Z" fill="#C5BED4" strokeWidth="0" />
                </svg>
              </div>

              <div className="pill-status">
                <SunriseIcon className="w-3.5 h-3.5" style={{ stroke: 'var(--color-sage)' }} />
                <span>Auspicious Sunrise</span>
              </div>
            </div>

            {/* Sunset Card */}
            <div className="sun-card sunset">
              <div className="sun-card-header">
                <SunsetIcon className="sun-card-icon" />
                <span className="sun-card-title">Sunset</span>
              </div>
              <span className="sun-card-time">{formatTimeString(calculations.sunset)}</span>
              
              {/* Arched window decoration */}
              <div className="arched-window">
                <div className="arch-bg"></div>
                {/* Layered mountain scenery SVG with vector sun & rays */}
                <svg viewBox="0 0 100 100" className="arch-silhouette" fill="none">
                  <defs>
                    <radialGradient id="sunsetSun" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFF4EF" />
                      <stop offset="50%" stopColor="#F3B39C" />
                      <stop offset="100%" stopColor="#D6745B" />
                    </radialGradient>
                    <filter id="sunsetGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Sunburst Rays */}
                  <g stroke="#D6745B" strokeWidth="1.0" opacity="0.55" strokeLinecap="round">
                    <line x1="50" y1="72" x2="50" y2="55" />
                    <line x1="34" y1="88" x2="18" y2="88" />
                    <line x1="66" y1="88" x2="82" y2="88" />
                    <line x1="38" y1="76" x2="27" y2="65" />
                    <line x1="62" y1="76" x2="73" y2="65" />
                    
                    <line x1="43" y1="74" x2="36" y2="64" strokeWidth="0.6" opacity="0.35" />
                    <line x1="57" y1="74" x2="64" y2="64" strokeWidth="0.6" opacity="0.35" />
                  </g>
                  
                  {/* Sun Disk */}
                  <circle cx="50" cy="88" r="12" fill="url(#sunsetSun)" filter="url(#sunsetGlow)" />
                  
                  {/* Mountain silhouettes */}
                  <path d="M0,100 L0,78 C30,72 40,88 60,82 C80,76 90,84 100,78 L100,100 Z" fill="#E6C5B8" opacity="0.6" strokeWidth="0" />
                  <path d="M0,100 L0,84 C25,82 35,92 55,86 C75,80 85,90 100,82 L100,100 Z" fill="#D69580" opacity="0.8" strokeWidth="0" />
                </svg>
              </div>

              <div className="pill-status">
                <SunsetIcon className="w-3.5 h-3.5" style={{ stroke: 'var(--color-terracotta)' }} />
                <span>Peaceful Sunset</span>
              </div>
            </div>
          </div>

          {/* Wednesday Abhijit warning notice */}
          {today.getDay() === 3 && (
            <div className="info-notice info-notice-warning">
              <Info className="info-notice-icon" />
              <span>
                <strong>Wednesday Exception:</strong> Abhijit Muhurtha is not recommended for starting new tasks on Wednesdays due to the clash with Mercury's energy.
              </span>
            </div>
          )}

          {/* Nakshatra Information Info notice */}
          <div className="info-notice info-notice-info">
            <Compass className="info-notice-icon" style={{ stroke: 'var(--color-sage)' }} />
            <span>
              Active Nakshatra: <strong>{calculations.nakshatraName}</strong> ({formatTimeString(calculations.nakshatraStartTime)} - {formatTimeString(calculations.nakshatraEndTime)})
            </span>
          </div>

          {/* Section title bar */}
          <div className="section-header-bar">
            <h2 className="section-header-title font-serif">Daily Muhurtas</h2>
          </div>

          {/* Kalam Table Container */}
          <div className="kalam-table-container">
            <div className="kalam-table-header">
              <span>Kalam</span>
              <span>Start time</span>
              <span>End time</span>
            </div>

            <div className="kalam-rows-body">
              {blendedKalams.map((k, idx) => (
                <div 
                  key={idx} 
                  className={`kalam-row ${
                    k.type === 'auspicious' ? 'row-auspicious' : 
                    k.type === 'inauspicious' ? 'row-inauspicious' : 'row-neutral'
                  }`}
                  onClick={() => setSelectedKalam(k)}
                >
                  <div className="kalam-cell-name">
                    <div className="kalam-icon-wrapper">
                      {getKalamIcon(k.name)}
                    </div>
                    <span>{k.name}</span>
                  </div>
                  <span className="kalam-cell-time">{formatTimeString(k.startTime)}</span>
                  <span className="kalam-cell-time">{formatTimeString(k.endTime)}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Details Modal */}
      {selectedKalam && (
        <div className="modal-overlay" onClick={() => setSelectedKalam(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedKalam(null)}>
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="modal-title title-serif">{selectedKalam.name}</h3>
            
            <div className={`modal-badge ${
              selectedKalam.type === 'auspicious' ? 'badge-auspicious' :
              selectedKalam.type === 'inauspicious' ? 'badge-inauspicious' : 'badge-neutral'
            }`}>
              {selectedKalam.type}
            </div>

            <div className="modal-time-box">
              <div className="modal-time-label">Time Window</div>
              <div className="modal-time-range">
                {formatTimeString(selectedKalam.startTime)} - {formatTimeString(selectedKalam.endTime)}
              </div>
            </div>

            <p className="modal-body-text">
              {selectedKalam.advice}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar widget */}
      <nav className="bottom-tab-bar">
        <div 
          className={`tab-bar-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setScreen('welcome'); }}
        >
          <svg viewBox="0 0 24 24" className="tab-bar-icon" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </div>

        <div 
          className={`tab-bar-item ${activeTab === 'panchangam' ? 'active' : ''}`}
          onClick={() => { setActiveTab('panchangam'); setScreen('dashboard'); }}
        >
          <svg viewBox="0 0 24 24" className="tab-bar-icon" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Panchangam</span>
        </div>

        {/* Center popping compass tab button */}
        <div 
          className="tab-bar-item tab-bar-item-center"
          onClick={() => { setActiveTab('today'); setScreen('dashboard'); }}
        >
          <Compass className="tab-bar-icon" />
          <span className="center-label">Today</span>
        </div>

        <div 
          className={`tab-bar-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => { setActiveTab('calendar'); setScreen('dashboard'); }}
        >
          <svg viewBox="0 0 24 24" className="tab-bar-icon" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="9" y1="4" x2="9" y2="22" />
            <line x1="15" y1="4" x2="15" y2="22" />
          </svg>
          <span>Calendar</span>
        </div>

        <div 
          className={`tab-bar-item ${activeTab === 'more' ? 'active' : ''}`}
          onClick={() => { setActiveTab('more'); alert("Developed by Antigravity under Advanced Agentic Coding."); }}
        >
          <svg viewBox="0 0 24 24" className="tab-bar-icon" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
          <span>More</span>
        </div>
      </nav>
    </div>
  );
}

// Simple Flower / Lotus SVG Icon component
function FlowerIcon({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      className={className}
      style={style}
    >
      <path d="M12,22 C12,18 8,15 8,12 C8,9 10,7 12,4 C14,7 16,9 16,12 C16,15 12,18 12,22 Z" />
      <path d="M12,22 C12,18 4,16 4,12 C4,8 8,7 12,4 C16,7 20,8 20,12 C20,16 12,18 12,22 Z" opacity="0.5" />
    </svg>
  );
}

