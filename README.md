<div align="center">
  <h1>👾 THIRD_PLACE.SYS 👾</h1>
  <p><strong>Your personal spot scout & virtual cafe simulator.</strong></p>
</div>

---

## ☕ What is it?
**Third Place Finder** is a feature-rich web app for deep-focus people and study groups looking for their ideal Seattle third place (café, library, coffee shop) plus virtual lo-fi ambience when staying in.

## ✨ New Features (Latest)
- **Seattle Live Map Mode**: `fetchSeattlePlacesOverpass()` pulls OpenStreetMap data for Seattle (
amenities: cafe, library, coffee shop) and displays dozens of live options.
- **Google Places optional path**: Set `GOOGLE_PLACES_API_KEY` in `frontend/app.js` to use real-time Google Places and reviews.
- **Match preferences to the map**: `matchVenuesToPreferences(venues, userPrefs)` filters live results based on chat input (noise, group, outlets, caffeine, time).
- **Study Buddy Chat Flow**:
  - set up with onboarding questions
  - then interactive chat mode with options: `RECOMMEND QUIET SPOTS`, `FIND PLACES WITH OUTLETS`, `SHOW MOST RATED`, etc.
  - responder provides curated quick options + cards
- **Full card detail + interaction**:
  - `REVIEWS` button (Google mode) fetches place details and shows up to 3 reviews
  - `NAVIGATE` button opens Google Maps directions (from user location to selected spot)
  - location details and reason text appear in cards
- **High-contrast mode toggle**:
  - user interface accessibility toggle for better readability.

## 🛠️ Getting Started
### 1. Clone repository
```bash
git clone https://github.com/shravanibnikam/Third-Place-Finder-Web.git
cd "Third Place Finder"/frontend
```

### 2. Open in browser (recommended Live Server)
- Option A: plain file `index.html` (works, but geolocation & CORS may vary)
- Option B: start local server:
  - `python -m http.server 8000`
  - open `http://127.0.0.1:8000`

### 3. Optional: Add Google Places API key for review mode
1. In `frontend/app.js`, set:
   - `const GOOGLE_PLACES_API_KEY = "YOUR_KEY";`
   - `const GOOGLE_PLACES_ENABLED = Boolean(GOOGLE_PLACES_API_KEY);`
2. Without key: app uses OSM Overpass and mock fallback.

## ▶️ Usage Flow
1. Open app, complete onboarding conversation.
2. Map unlocks, results loaded from OSM/Google or fallback mock.
3. Click recommended cards to fly map.
4. Use `NAVIGATE` to open real directions.
5. Use `REVIEWS` when available.
6. Use chat queries or quick actions for dynamic matching.

## 🗂️ Key file summary
- `frontend/index.html`: UI layout and controls
- `frontend/style.css`: retro theme + contrast improvements
- `frontend/app.js`: all logic
  - chat, onboarding, map, venue fetch, matching, details, routing

## ✅ Commit
Final feature commit in this branch:
- `feat: add Seattle Overpass and Google Places live matching with study-buddy chat`

## 🚀 Run this right now
1. Start local server:
   `cd frontend` + `python -m http.server 8000`
2. `http://127.0.0.1:8000`
3. Optionally, install Live Server extension for VS Code.

## 🧩 Notes
- Overpass has rate limits; local reload may sometimes delay.
- Google Places API in browser may require proxy to avoid CORS.
- 'NAVIGATE' opens Google Maps external site.
- UI is retro and intentionally pixel-art oriented.

---
Made to be fully functional in one edit with the user’s priorities:
live data, full details, related comfortable chitchat, route action, and accessibility.
