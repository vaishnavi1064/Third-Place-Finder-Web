const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');

// Always load .env from the backend folder (works even if Node is started from repo root)
dotenv.config({ path: path.join(__dirname, '.env') });

// --- MySQL setup ---
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'third_place_finder',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_HOST?.includes('aivencloud.com') ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
    console.error('[DB] Pool error (server stays up; will retry on next query):', err.code || err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[SYS] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[SYS] Uncaught exception:', err);
    process.exit(1);
});

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('[DB] ✅ MySQL connected successfully');
        conn.release();
        return true;
    } catch (err) {
        console.error('[DB] ❌ MySQL connection failed:', err.message || JSON.stringify(err) || err);
        return false;
    }
}

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// GROQ AI SETUP (from Vaishnavi's branch)
// ═══════════════════════════════════════════
const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;
const groqModel = "llama-3.3-70b-versatile";
const systemInstruction = "You are 'THIRD_PLACE.EXE' — a retro terminal AI assistant. Your PRIMARY mission is helping users find coffee shops, cafes, libraries, and study spots. But you are also a fully capable general assistant: you can answer questions about this app/platform, study-related questions, and general knowledge questions. Always respond in short, punchy, retro terminal uppercase style. Be robotic but genuinely helpful. Keep responses concise — 2-4 sentences max unless a detailed answer is needed.";

async function withRetry(operation, maxRetries = 4, defaultDelayMs = 4000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
            const isRateLimited = error.message?.includes('429') || error.message?.includes('quota');
            if (i === maxRetries - 1 || (!isOverloaded && !isRateLimited)) throw error;
            let delayToUse = defaultDelayMs;
            if (isRateLimited) {
                const match = error.message?.match(/retry in ([\d\.]+)s/);
                if (match && match[1]) delayToUse = (parseFloat(match[1]) * 1000) + 1000;
            }
            console.log(`[SYS] Groq API blocked. Retrying in ${delayToUse / 1000}s... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayToUse));
        }
    }
}

let chatHistory = [];

// ═══════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════
app.get('/api/health', async (req, res) => {
    const dbOk = await testConnection();
    res.json({ status: dbOk ? 'healthy' : 'degraded', db: dbOk });
});

// ═══════════════════════════════════════════
// AI CHAT (Groq) — from Vaishnavi's branch
// ═══════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
    try {
        if (!groq) {
            return res.status(503).json({
                error: 'COMMLINK OFFLINE. SET VARIABLE GROQ_API_KEY IN backend/.env AND RESTART THE SERVER.'
            });
        }
        const { message, reset } = req.body;
        if (reset || chatHistory.length === 0) {
            chatHistory = [{ role: "system", content: systemInstruction }];
        }
        chatHistory.push({ role: "user", content: message });
        const result = await withRetry(() => groq.chat.completions.create({
            model: groqModel,
            messages: chatHistory,
            max_completion_tokens: 300
        }));
        const reply = result.choices[0]?.message?.content || "";
        chatHistory.push({ role: "assistant", content: reply });
        res.json({ response: reply });
    } catch (error) {
        console.error("Groq Chat Error:", error);
        res.status(500).json({ error: "COMMLINK FAILURE. CHECK API KEY AND NETWORK." });
    }
});

// ═══════════════════════════════════════════
// RECOMMEND (Geoapify + Groq) — from Vaishnavi's branch
// ═══════════════════════════════════════════
function buildCategories(preferences) {
    const cats = new Set(['catering.cafe']);
    const noise = (preferences.noise || '').toUpperCase();
    const caffeine = (preferences.caffeine || '').toUpperCase();
    if (noise.includes('SILENCE') || noise.includes('LIBRARY')) {
        cats.add('education.library');
    } else if (noise.includes('LIVELY') || noise.includes('LOUD')) {
        cats.add('catering.bar');
        cats.add('catering.restaurant');
    } else {
        cats.add('catering.restaurant');
    }
    if (caffeine.includes('SPECIALTY')) cats.add('catering.cafe.coffee_shop');
    else if (caffeine.includes('JUST A TABLE')) cats.add('education.library');
    else if (caffeine.includes('FOOD')) { cats.add('catering.restaurant'); cats.add('catering.fast_food'); }
    return Array.from(cats).join(',');
}

app.post('/api/recommend', async (req, res) => {
    try {
        const { preferences, lat, lon } = req.body;
        const useLat = parseFloat(lat) || 47.615;
        const useLon = parseFloat(lon) || -122.33;
        const categories = buildCategories(preferences || {});
        const geoUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${useLon},${useLat},8000&limit=80&apiKey=${process.env.GEOAPIFY_API_KEY}`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error(`Geoapify error: ${geoRes.status}`);
        const geoData = await geoRes.json();
        const rawPlaces = (geoData.features || [])
            .filter(f => f.properties?.name)
            .map((f, idx) => ({
                index: idx + 1,
                name: f.properties.name,
                address: f.properties.formatted || f.properties.address_line2 || '',
                category: (f.properties.categories || []).join(', '),
                coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
                tags: f.properties.datasource?.raw || {}
            }));
        if (rawPlaces.length === 0) return res.json([]);

        const placeList = rawPlaces.map(p =>
            `${p.index}. "${p.name}" | ${p.category} | ${p.address} | tags: ${JSON.stringify(p.tags).slice(0, 120)}`
        ).join('\n');
        const prompt = `You are a smart third-place scout. User preferences:
- Noise tolerance: ${preferences?.noise || 'any'}
- Group size: ${preferences?.group_size || 'any'}
- Time of day: ${preferences?.time || 'any'}
- Power outlets: ${preferences?.outlets || 'any'}
- Caffeine need: ${preferences?.caffeine || 'any'}

Here are ${rawPlaces.length} nearby places:\n${placeList}\n
Pick the TOP 10 that BEST match the user preferences. Return ONLY a valid JSON array with fields: index, noise, outlets, why.`;

        if (!groq) {
            const fallback = rawPlaces.slice(0, 10).map((p) => ({
                id: `geo-${p.index}-${p.name}`,
                name: p.name,
                coords: p.coords,
                noise: 'N/A',
                outlets: 'N/A',
                distance: `${Math.floor(Math.random() * 15) + 3} MIN`,
                reason: (p.category.split(',')[0] || 'PLACE').toUpperCase().replace(/CATERING\.|LEISURE\.|OFFICE\./g, ''),
                rating: p.tags?.stars || 'N/A',
                address: p.address,
                why: 'NEARBY RESULT (ADD GROQ_API_KEY FOR AI RANKING).'
            }));
            return res.json(fallback);
        }

        const groqResult = await withRetry(() => groq.chat.completions.create({
            model: groqModel,
            messages: [{ role: "user", content: prompt }]
        }));
        const rawText = groqResult.choices[0]?.message?.content || "";
        const jsonMatch = rawText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (!jsonMatch) throw new Error('No JSON array found in Groq response');
        const recommendations = JSON.parse(jsonMatch[0]);

        const finalPlaces = recommendations
            .filter(r => r.index >= 1 && r.index <= rawPlaces.length)
            .map(r => {
                const p = rawPlaces[r.index - 1];
                return {
                    id: `geo-${r.index}-${p.name}`,
                    name: p.name,
                    coords: p.coords,
                    noise: r.noise,
                    outlets: r.outlets,
                    distance: `${Math.floor(Math.random() * 15) + 3} MIN`,
                    reason: p.category.split(',')[0].toUpperCase().replace('CATERING.', '').replace('LEISURE.', '').replace('OFFICE.', '') || 'CAFE',
                    rating: p.tags?.stars || 'N/A',
                    address: p.address,
                    why: r.why
                };
            });
        res.json(finalPlaces);
    } catch (error) {
        console.error("Recommend Error:", error?.message || error);
        res.status(500).json({ error: "SCANNER TIMEOUT.", detail: error?.message || String(error) });
    }
});

// ═══════════════════════════════════════════
// AUTH ENDPOINTS (MySQL)
// ═══════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ error: 'username, email, and password are required' });
        const password_hash = await bcrypt.hash(password, 10);
        const session_id = uuidv4();
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password_hash, is_guest, session_id) VALUES (?, ?, ?, FALSE, ?)`,
            [username.toLowerCase(), email, password_hash, session_id]
        );
        res.status(201).json({
            user: { id: result.insertId, username: username.toLowerCase(), email, is_guest: false, session_id }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username or email already exists' });
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'username and password are required' });
        const ident = String(username).trim().toLowerCase();
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR LOWER(email) = ?',
            [ident, ident]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid username or password' });
        const session_id = uuidv4();
        await pool.query('UPDATE users SET session_id = ?, last_active = NOW() WHERE id = ?', [session_id, user.id]);
        res.json({ user: { id: user.id, username: user.username, email: user.email, is_guest: false, session_id } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/guest', async (req, res) => {
    try {
        const session_id = uuidv4();
        const [result] = await pool.query('INSERT INTO users (is_guest, session_id) VALUES (TRUE, ?)', [session_id]);
        res.status(201).json({ user: { id: result.insertId, username: null, is_guest: true, session_id } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create guest session' });
    }
});

app.get('/api/auth/me/:session_id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, is_guest, session_id FROM users WHERE session_id = ?',
            [req.params.session_id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        res.json({ user: rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ═══════════════════════════════════════════
// PLACES (MySQL)
// ═══════════════════════════════════════════

// Upsert a place by name — used when saving AI-recommended venues as favorites
app.post('/api/places/upsert', async (req, res) => {
    try {
        const { name, address, latitude, longitude, category, noise_level } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        // Return existing place if name matches
        const [existing] = await pool.query('SELECT id FROM places WHERE name = ?', [name]);
        if (existing.length > 0) return res.json({ id: existing[0].id });

        // Insert new place with safe defaults
        const cat = ['cafe','library','coworking'].includes(category) ? category : 'cafe';
        const noise = ['silent','quiet','moderate','lively'].includes(noise_level) ? noise_level : 'moderate';
        const [result] = await pool.query(
            `INSERT INTO places (name, category, address, latitude, longitude, noise_level, has_outlets, has_wifi, serves_coffee, group_friendly)
             VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, TRUE, TRUE)`,
            [name, cat, address || '', parseFloat(latitude) || 0, parseFloat(longitude) || 0, noise]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Upsert place error:', err);
        res.status(500).json({ error: 'Failed to upsert place' });
    }
});

app.get('/api/places', async (req, res) => {
    try {
        const { category, noise_level, has_outlets, serves_coffee, group_friendly } = req.query;
        let sql = 'SELECT * FROM places WHERE 1=1';
        const params = [];
        if (category) { sql += ' AND category = ?'; params.push(category); }
        if (noise_level) { sql += ' AND noise_level = ?'; params.push(noise_level); }
        if (has_outlets) { sql += ' AND has_outlets = ?'; params.push(has_outlets === 'true' ? 1 : 0); }
        if (serves_coffee) { sql += ' AND serves_coffee = ?'; params.push(serves_coffee === 'true' ? 1 : 0); }
        if (group_friendly) { sql += ' AND group_friendly = ?'; params.push(group_friendly === 'true' ? 1 : 0); }
        sql += ' ORDER BY avg_rating DESC';
        const [rows] = await pool.query(sql, params);
        res.json({ count: rows.length, places: rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch places' });
    }
});

app.get('/api/places/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM places WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Place not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch place' });
    }
});

// ═══════════════════════════════════════════
// FAVORITES (registered users only)
// ═══════════════════════════════════════════
async function requireRegistered(req, res, next) {
    const user_id = req.params.user_id || req.body.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    try {
        const [rows] = await pool.query('SELECT is_guest FROM users WHERE id = ?', [user_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        if (rows[0].is_guest)
            return res.status(403).json({ error: 'Guests cannot save favorites. Please sign up to use this feature!' });
        next();
    } catch (err) {
        res.status(500).json({ error: 'Auth check failed' });
    }
}

app.get('/api/favorites/:user_id', requireRegistered, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT f.id AS favorite_id, f.created_at AS favorited_at, p.*
             FROM favorites f JOIN places p ON f.place_id = p.id
             WHERE f.user_id = ? ORDER BY f.created_at DESC`,
            [req.params.user_id]
        );
        res.json({ count: rows.length, favorites: rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

app.post('/api/favorites', requireRegistered, async (req, res) => {
    try {
        const { user_id, place_id } = req.body;
        await pool.query('INSERT INTO favorites (user_id, place_id) VALUES (?, ?)', [user_id, place_id]);
        res.status(201).json({ message: 'Added to favorites!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already in favorites' });
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

app.delete('/api/favorites/:user_id/:place_id', requireRegistered, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM favorites WHERE user_id = ? AND place_id = ?',
            [req.params.user_id, req.params.place_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Favorite not found' });
        res.json({ message: 'Removed from favorites' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

// ═══════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════
app.get('/api/places/:id/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, u.username FROM reviews r LEFT JOIN users u ON r.user_id = u.id
             WHERE r.place_id = ? ORDER BY r.created_at DESC`,
            [req.params.id]
        );
        res.json({ reviews: rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { user_id, place_id, rating, comment } = req.body;
        await pool.query(
            `INSERT INTO reviews (user_id, place_id, rating, comment) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
            [user_id, place_id, rating, comment]
        );
        await pool.query(
            `UPDATE places SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE place_id = ?),
             review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = ?) WHERE id = ?`,
            [place_id, place_id, place_id]
        );
        res.json({ message: 'Review saved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════
const server = app.listen(PORT, async () => {
    console.log(`[SYS] 🚀 Server running on http://localhost:${PORT}`);
    console.log(`[SYS] Groq API: ${process.env.GROQ_API_KEY ? 'YES' : 'NO'}`);
    console.log(`[SYS] Geoapify API: ${process.env.GEOAPIFY_API_KEY ? 'YES' : 'NO'}`);
    await testConnection();
    console.log('\n[SYS] Demo accounts: shravani/demo1234, aangi/demo1234, Guest mode');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[SYS] Port ${PORT} is already in use. Stop the other Node process or set PORT in backend/.env`);
    } else {
        console.error('[SYS] HTTP server error:', err.message);
    }
    process.exit(1);
});
