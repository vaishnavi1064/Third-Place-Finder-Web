<div align="center">
  <h1>Third Place Finder</h1>
  <p><strong>AI-powered spot scout for cafés, libraries & coworking spaces — with a built-in lo-fi ambience mixer.</strong></p>

  <p>
    <a href="https://third-place-finder-web.vercel.app/">Live Demo</a> ·
    <a href="https://github.com/shravanibnikam/Third-Place-Finder-Web/issues">Report Bug</a>
  </p>
</div>

---

## What is it?

Third Place Finder helps you find your ideal study or focus spot — a café, library, or coworking space — near your current location. An AI chat assistant guides you through your preferences (noise level, group size, outlets, etc.) and recommends the best matching venues on an interactive map.

When you can't go out, the built-in ambient sound mixer and Pomodoro timer let you simulate the feel of a productive third place from home.

---

## Features

- **AI Spot Scout** — conversational onboarding via Groq AI, recommends nearby venues based on your preferences
- **Live Map** — interactive Leaflet map with venue markers, popups, and directions to Google Maps
- **Favorites** — registered users can save and revisit their favourite spots
- **Ambient Mixer** — mix Lo-Fi, Rain, Chatter, and Fire sounds with individual volume sliders
- **Pomodoro Timer** — built-in focus/break timer alongside your ambient session
- **Guest Mode** — use the app without signing up; create an account to save favorites
- **Dark / Light Mode** — full theme toggle
- **User Accounts** — sign up, log in by username or email, persistent sessions via localStorage

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| Radix UI | Accessible component primitives |
| Leaflet + react-leaflet | Interactive map |
| React Router v7 | Client-side routing |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MySQL2 | Database driver |
| Groq SDK | AI chat & venue recommendations |
| bcrypt | Password hashing |
| dotenv | Environment variable loading |
| uuid | Session ID generation |

### Database
| Table | Purpose |
|---|---|
| `users` | Registered & guest accounts |
| `places` | Venue records (café, library, coworking) |
| `favorites` | Per-user saved places |
| `reviews` | User ratings & comments |
| `user_preferences` | Onboarding preference storage |
| `ambient_presets` | Saved ambient mixer configs |

### Deployment
| Service | Role |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Aiven | Managed MySQL database |

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- npm
- MySQL 8+ (local) **or** an Aiven MySQL instance

### 1. Clone the repo

```bash
git clone https://github.com/shravanibnikam/Third-Place-Finder-Web.git
cd Third-Place-Finder-Web
```

### 2. Set up environment variables

Create `backend/.env` based on the example below:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

# MySQL (local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=third_place_finder

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Geoapify (place search)
GEOAPIFY_API_KEY=your_geoapify_api_key
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Set up the database

```bash
mysql -u root -p < backend/schema.sql
mysql -u root -p < backend/seed.sql   # optional demo data
```

### 4. Install dependencies and start

```bash
npm run up
```

This runs `npm install` for root, backend, and frontend, then starts both servers concurrently.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## Available Scripts (root)

| Script | What it does |
|---|---|
| `npm run up` | Install all dependencies + start everything |
| `npm start` | Start backend and frontend together |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default 3000) |
| `FRONTEND_URL` | Yes | Allowed CORS origin |
| `DB_HOST` | Yes* | MySQL host |
| `DB_PORT` | Yes* | MySQL port |
| `DB_USER` | Yes* | MySQL username |
| `DB_PASSWORD` | Yes* | MySQL password |
| `DB_NAME` | Yes* | Database name |
| `DB_URL` | Alt | Full connection string (used for Aiven) |
| `GROQ_API_KEY` | Yes | Groq AI API key |
| `GEOAPIFY_API_KEY` | Yes | Geoapify places API key |

*Either `DB_URL` or individual `DB_*` fields are required.

### Frontend (`frontend/.env.local` or `.env.production`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL |

---

## Project Structure

```
Third-Place-Finder-Web/
├── backend/
│   ├── server.js          # Express API server
│   ├── schema.sql         # MySQL table definitions
│   ├── schema_aiven.sql   # Schema for Aiven (no CREATE DATABASE)
│   ├── seed.sql           # Demo data
│   └── .env               # Environment variables (not committed)
├── frontend/
│   └── src/app/
│       ├── components/    # ChatBox, MapWindow, NearbyList, etc.
│       ├── context/       # AuthContext, MapContext, ThemeContext
│       ├── layouts/       # MainLayout
│       └── pages/         # LoginPage, UserSettingsPage
├── package.json           # Root scripts (concurrently)
└── README.md
```

---

## Deployment

### Backend — Render
1. Create a new **Web Service** pointing to this repo.
2. Set **Root Directory** to `backend`, **Start Command** to `node server.js`.
3. Add all `backend/.env` variables as environment variables in Render's dashboard.

### Database — Aiven
1. Create a **MySQL** service on [Aiven](https://aiven.io).
2. Allow your Render service IP (or `0.0.0.0/0`) in Aiven's firewall settings.
3. Run the schema against `defaultdb`:
   ```bash
   mysql -h <host> -P <port> -u avnadmin -p<password> --ssl-mode=REQUIRED defaultdb < backend/schema_aiven.sql
   ```
4. Set `DB_URL` in Render using the Aiven connection string.

### Frontend — Vercel
1. Import the repo into [Vercel](https://vercel.com), set **Root Directory** to `frontend`.
2. Add environment variable: `VITE_API_URL=https://your-render-service.onrender.com`
3. Deploy — Vercel auto-deploys on every push to `main`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login (username or email) |
| `POST` | `/api/auth/guest` | Create a guest session |
| `GET` | `/api/auth/user/:id` | Get user by ID |
| `POST` | `/api/recommend` | AI venue recommendations |
| `POST` | `/api/chat` | Free-form AI chat |
| `POST` | `/api/places/upsert` | Create or retrieve a place record |
| `GET` | `/api/favorites/:user_id` | Get user's saved favorites |
| `POST` | `/api/favorites` | Save a favorite |
| `DELETE` | `/api/favorites/:user_id/:place_id` | Remove a favorite |

---

## Getting API Keys

- **Groq** — [console.groq.com](https://console.groq.com) (free tier available)
- **Geoapify** — [myprojects.geoapify.com](https://myprojects.geoapify.com) (free tier: 3000 req/day)

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.

---

## License

MIT
