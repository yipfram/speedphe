# Casphé - Coffee Shop WiFi Speed Map

## Project Overview

**Name:** Casphé
**Type:** Web Application
**Core Functionality:** A map showing internet speeds at coffee shops to help remote workers find suitable places to work.
**Target Users:** Remote workers, digital nomads, freelancers who work from coffee shops.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Next.js + Leaflet)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API                                  │
│                      (Next.js API Routes)                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│     PostgreSQL          │     │      Google Places API      │
│     (Supabase/Neon)    │     │   (Find nearby coffee shops) │
└─────────────────────────┘     └─────────────────────────────┘
```

## Technology Stack

| Component | Technology                     |
| --------- | ------------------------------ |
| Framework | Next.js 14 (App Router)        |
| Language  | TypeScript                     |
| Map       | Leaflet + OpenStreetMap (free) |
| Speedtest | @cloudflare/speedtest SDK      |
| Database  | PostgreSQL (Supabase or Neon)  |
| Places    | Google Places API              |
| Auth      | Supabase Auth (optional, v1)   |
| Styling   | Tailwind CSS                   |

## Features

### v1 - MVP

1. **Map View**
   - Interactive map centered on user location
   - Coffee shop markers with speed indicator colors:
     - 🟢 Green: >50 Mbps (Great for work)
     - 🟡 Yellow: 25-50 Mbps (Usable)
     - 🟠 Orange: 10-25 Mbps (Basic)
     - 🔴 Red: <10 Mbps (Poor)
   - Click marker → see place details + speed stats

2. **Location Detection**
   - Request GPS permission on load
   - Fallback to IP-based location
   - Allow manual location search

3. **Place Discovery**
   - Query Google Places API for "coffee shop" within 5km
   - Display results as markers on map
   - Allow users to add places not in Google Places

4. **Speedtest Integration**
   - "Run Speedtest" button on place page
   - Uses Cloudflare Speedtest SDK
   - Shows live progress (download, upload, latency)
   - Saves results to database after completion

5. **Place Details Page**
   - Name, address, hours (from Google Places)
   - Speed stats: average, latest, historical
   - Number of tests submitted
   - Run speedtest button

6. **User Contributions (No login required)**
   - Anyone can run a speedtest
   - Optional login to track contributions
   - Users can see their submitted tests

### v2 - Future

- "Workability" score (noise level, outlets, seating comfort)
- User reviews/ratings
- Filters (quiet, good food, outdoor seating)
- Mobile app
- API for third-party developers

## API Design

### Endpoints

```
GET  /api/places
     - Query params: lat, lng, radius
     - Returns: list of coffee shops with speed data

GET  /api/places/:id
     - Returns: place details + speed stats

POST /api/places
     - Body: name, lat, lng, address (for places not in Google)

GET  /api/places/:id/speedtests
     - Returns: speed test history for a place

POST /api/speedtests
     - Body: place_id, download, upload, latency, jitter, packet_loss
     - Returns: created speedtest record
```

### Data Models

```sql
-- Places table
places {
  id: uuid (PK)
  name: text
  address: text
  lat: float
  lng: float
  google_place_id: text (nullable)
  created_at: timestamptz
}

-- Speedtests table
speedtests {
  id: uuid (PK)
  place_id: uuid (FK)
  user_id: uuid (FK, nullable)
  download_mbps: float
  upload_mbps: float
  latency_ms: float
  jitter_ms: float
  packet_loss: float
  created_at: timestamptz
}

-- Users table (optional auth)
users {
  id: uuid (PK)
  email: text
  created_at: timestamptz
}
```

## UI/UX Design

### Pages

1. **Home/Map Page** (`/`)
   - Full-screen map
   - Search bar (top)
   - "Add Place" button
   - Current location button

2. **Place Detail** (modal or side panel)
   - Place info header
   - Speed stats cards
   - Run speedtest CTA
   - Speedtest history

3. **Speedtest Modal**
   - "Start Test" button
   - Progress indicators
   - Live results display
   - "Save to this place" confirmation

4. **Add Place Form**
   - Name input
   - Pin location on map
   - Address (optional)

### Color Palette

| Role       | Color                   |
| ---------- | ----------------------- |
| Primary    | `#2D1B69` (Deep purple) |
| Secondary  | `#FF6B35` (Warm orange) |
| Background | `#FAFAFA`               |
| Text       | `#1A1A1A`               |
| Success    | `#22C55E`               |
| Warning    | `#EAB308`               |
| Error      | `#EF4444`               |

### Typography

- Headings: `Inter` (bold)
- Body: `Inter` (regular)
- Monospace: `JetBrains Mono` (for speed numbers)

## Data Collection Note

The Cloudflare Speedtest SDK collects measurement results on completion for aggregated Internet quality insights. This is disclosed in their documentation.

## Development Phases

### Phase 1: Setup

- [ ] Initialize Next.js project
- [ ] Set up database (Supabase/Neon)
- [ ] Configure Tailwind CSS
- [ ] Install Leaflet + React-Leaflet

### Phase 2: Map & Places

- [ ] Implement map with OpenStreetMap
- [ ] Add Google Places API integration
- [ ] Create place markers
- [ ] Implement place detail view

### Phase 3: Speedtest

- [ ] Integrate Cloudflare Speedtest SDK
- [ ] Create speedtest modal/flow
- [ ] Connect to API endpoints

### Phase 4: Data & Polish

- [ ] Speed test submission to DB
- [ ] Speed aggregation/display
- [ ] Optional auth
- [ ] Polish UI

## Pricing Notes

- **Cloudflare Speedtest SDK**: Free
- **Google Places API**: ~10k free requests/month
- **Map**: Free (OpenStreetMap)
- **Database**: Free tier available (Supabase/Neon)
- **Hosting**: Vercel (free tier)

Total running cost for MVP: **$0/month** (within free tiers)
