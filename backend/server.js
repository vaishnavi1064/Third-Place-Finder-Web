const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = 3000;

// ── Gemini setup ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat model — for the Spot Scout chatbot conversation
const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are 'THIRD_PLACE.EXE' — a retro terminal AI assistant. Your PRIMARY mission is helping users find coffee shops, cafes, libraries, and study spots. But you are also a fully capable general assistant: you can answer questions about this app/platform (how to use the map, filters, Pomodoro timer, ambient sounds, etc.), study-related questions (explaining concepts, summarizing topics, helping with homework), and general knowledge questions (science, tech, culture, anything). Always respond in short, punchy, retro terminal uppercase style. Be robotic but genuinely helpful. Keep responses concise — 2-4 sentences max unless a detailed answer is needed."
});

// One-shot model for JSON recommendations (no JSON mode — extract with regex)
const recommendModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Holds server-side chat session
let chatSession = null;

// ── /api/chat — Spot Scout chatbot ───────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    try {
        const { message, reset } = req.body;
        if (reset || !chatSession) {
            chatSession = chatModel.startChat({ history: [] });
        }
        const result = await chatSession.sendMessage(message);
        res.json({ response: result.response.text() });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ error: "COMMLINK FAILURE. CHECK API KEY AND NETWORK." });
    }
});

// ── Helper: map preferences → Geoapify category list ─────────────────────────
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

    if (caffeine.includes('SPECIALTY')) {
        cats.add('catering.cafe.coffee_shop');
    } else if (caffeine.includes('JUST A TABLE')) {
        cats.add('education.library');
    } else if (caffeine.includes('FOOD')) {
        cats.add('catering.restaurant');
        cats.add('catering.fast_food');
    }

    return Array.from(cats).join(',');
}

// ── /api/recommend — Geoapify → Gemini RAG pipeline ─────────────────────────
app.post('/api/recommend', async (req, res) => {
    try {
        const { preferences, lat, lon } = req.body;
        const useLat = parseFloat(lat) || 47.615;
        const useLon = parseFloat(lon) || -122.33;

        // 1. Build categories from preferences
        const categories = buildCategories(preferences || {});

        // 2. Fetch from Geoapify
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

        if (rawPlaces.length === 0) {
            return res.json([]);
        }

        // 3. Ask Gemini to pick the best 10
        const placeList = rawPlaces.map(p =>
            `${p.index}. "${p.name}" | ${p.category} | ${p.address} | tags: ${JSON.stringify(p.tags).slice(0, 120)}`
        ).join('\n');

        const prompt = `You are a smart third-place scout. User preferences:
- Noise tolerance: ${preferences?.noise || 'any'}
- Group size: ${preferences?.group_size || 'any'}
- Time of day: ${preferences?.time || 'any'}
- Power outlets: ${preferences?.outlets || 'any'}
- Caffeine need: ${preferences?.caffeine || 'any'}

Here are ${rawPlaces.length} nearby places:
${placeList}

Pick the TOP 10 that BEST match the user preferences. Use your world knowledge about these places if you recognise them.
Return ONLY a valid JSON array (no markdown, no explanation) with exactly these fields:
[
  {
    "index": <1-based number from list>,
    "noise": "<SILENT|MODERATE|LIVELY>",
    "outlets": "<ABUNDANT|FEW|UNKNOWN>",
    "why": "<one short sentence explaining why this place matches>"
  }
]`;

        const geminiResult = await recommendModel.generateContent(prompt);
        const rawText = geminiResult.response.text();

        // Extract JSON array robustly (strip markdown code fences if present)
        const jsonMatch = rawText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (!jsonMatch) throw new Error('No JSON array found in Gemini response');
        const recommendations = JSON.parse(jsonMatch[0]);

        // 4. Map recommendations back to full place objects
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

app.listen(PORT, () => {
    console.log(`[SYS] Backend Node Server active on port ${PORT}...`);
    console.log(`[SYS] Gemini API Loaded: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO'}`);
    console.log(`[SYS] Geoapify API Loaded: ${process.env.GEOAPIFY_API_KEY ? 'YES' : 'NO'}`);
});
