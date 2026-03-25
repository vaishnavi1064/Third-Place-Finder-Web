# Third Place Finder — Backend

MySQL + Express REST API with user auth, favorites, and pre-loaded demo data.

## Setup (for anyone cloning this repo)

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### Steps

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — set `DB_PASSWORD` to your MySQL root password.

```bash
# Create database & tables
mysql -u root -p < schema.sql

# Load demo data (5 places, 2 users, favorites, reviews)
mysql -u root -p < seed.sql

# Start server
npm run dev
```

Server runs at `http://localhost:3000`

## Demo Accounts

| Username | Password | Type | Favorites? |
|----------|----------|------|------------|
| `shravani` | `demo1234` | Registered | Yes (has 3 saved) |
| `aangi` | `demo1234` | Registered | Yes (has 2 saved) |
| Guest | — | Guest | No (blocked with 403) |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (username, email, password) |
| POST | `/api/auth/login` | Login (username, password) |
| POST | `/api/auth/guest` | Start guest session |
| GET | `/api/auth/me/:session_id` | Get user from session |

### Places
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places` | List all (filters: category, noise_level, etc.) |
| GET | `/api/places/:id` | Single place |

### Favorites (registered users only — guests get 403)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites/:user_id` | Get user's favorites |
| POST | `/api/favorites` | Add favorite (user_id, place_id) |
| DELETE | `/api/favorites/:user_id/:place_id` | Remove favorite |

### Reviews & Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/preferences` | Save prefs → get recommendations |
| GET | `/api/places/:id/reviews` | Get reviews |
| POST | `/api/reviews` | Submit review |

## Pre-loaded Data

**5 Seattle places:** Elm Coffee Roasters, Seattle Central Library, Victrola Coffee, Office Nomads, Cafe Allegro

**Favorites already saved:**
- shravani → Elm Coffee, Central Library, Office Nomads
- aangi → Central Library, Cafe Allegro

**7 reviews** with ratings and comments already loaded.
