# 🌌 AakashaSutram (आकाशसूत्रम्)

> **Vedic Astro-Muhurta & Daily Kalam Calculator**

AakashaSutram is a premium, high-fidelity iOS-style web application designed to calculate daily Vedic timings (Muhurtas and Kalams) relative to a user's exact geographic coordinates. Built with a modern, soothing pastel palette and smooth micro-animations, AakashaSutram helps you align daily activities with cosmic rhythms.

---

## 🔮 Core Features

### 1. High-Precision Vedic Calculations
- **Brahma Muhurta**: The auspicious 48-minute period starting 96 minutes before sunrise.
- **Daytime Muhurtas**: Dynamic daylight divisions including **Pratah Kalam** (morning transition) and **Madhyahna Kalam** (midday transition).
- **Auspicious Transitions**: Twilight transitions like **Pradosha Kalam** (evening prayers).
- **Moon Nakshatra Alignments**: Calculations for **Amrita Kalam** (auspicious) and **Varjyam/Tyajya** (inauspicious) based on the Moon's transition through the active Nakshatra.
- **Kaalams**: Rotating weekday-based planetary hours including **Rahu Kalam**, **Yamagandam**, and **Gulika Kalam**.

### 2. Astrological Accuracy
- **Sidereal Lahiri Ayanamsa**: Converts standard tropical coordinates to traditional Hindu sidereal positions by calculating the precession offset (~24.9° in 2026).
- **Topocentric Lunar Parallax**: Adjusts Nakshatra calculations utilizing the observer's exact latitude and longitude coordinates to correct for lunar parallax, delivering factually accurate local timings.

### 3. iOS-Style Premium UI/UX Interactions
- **Autocomplete & Geolocation (GPS)**: Integrated Nominatim geocoding and TimeAPI.io timezone detection to dynamically adapt all timestamps to the destination clock time.
- **Clean Location Display**: Structured address parsing showing only `City, State, Country` to eliminate postcode and county clutter.
- **Fluid Scroll-Driven Header Collapse**:
  - The header containing location, dates, and titles remains fixed (sticky) at the top of the viewport.
  - As the user scrolls, the vector arched window illustrations and status pills shrink and fade out **pixel-by-pixel** in perfect coordination with the scroll progress.
  - At full collapse, titles and times snap cleanly into a single compact status pill.
  - Uses native CSS custom variables (`--scroll-progress`) updated via a React ref to maintain 60fps/120fps scrolling.
- **Unified Muhurtas Table**: Merges daily divisions and Kaalams into one table, sorted by spiritual status (Auspicious ➜ Neutral ➜ Inauspicious) and divided by clean, lavender column lines.

---

## 📸 Screenshots

### Welcome & Setup
![Welcome Screen](docs/screenshots/welcome.jpg)

### Astro Dashboard & Muhurtas
![Dashboard Screen](docs/screenshots/dashboard.jpg)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AakashaSutram.git
   cd AakashaSutram
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🧪 Testing

AakashaSutram features a complete test suite powered by **Vitest** and **React Testing Library** to validate calculations and UI flows.

Run the test suite:
```bash
npm run test
```

### Coverage
- **Cities Suite (`src/utils/cities.test.ts`)**: Validates offline approximation zone lookups.
- **Engine Suite (`src/utils/kalamCalculator.test.ts`)**: Validates Brahma Muhurta, Pratah, Madhyahna, and Nakshatra-based Ghati calculations.
- **UI Flow Suite (`src/App.test.tsx`)**: Stub-mocks browser geolocation and geocoding network fetches to test suggestion lists, selections, and screen navigation.
