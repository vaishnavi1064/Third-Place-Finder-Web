const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = 3000;

// Set up Gemini connection
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "You are the 'THIRD_PLACE.EXE' Retro Spot Scout AI. You talk in short, punchy, retro terminal style. You only use capitalized letters. Always keep responses under 2 sentences. Sound robotic but extremely helpful in finding coffee shops and study spots based on user preferences."
});

// Holds server-side chat session logic
let chatSession = null;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, reset } = req.body;
        
        // Start a fresh session if requested (to forget old history)
        if (reset || !chatSession) {
            chatSession = model.startChat({ history: [] });
        }
        
        const result = await chatSession.sendMessage(message);
        const text = result.response.text();
        
        res.json({ response: text });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "COMMLINK FAILURE. CHECK API KEY AND NETWORK." });
    }
});

// Securely proxying Overpass OSM so React doesn't make raw API calls
app.get('/api/cafes', async (req, res) => {
    // Dynamically lock onto the user's coordinates, or default to Seattle if denied
    const lat = parseFloat(req.query.lat) || 47.615;
    const lon = parseFloat(req.query.lon) || -122.33;
    const radius = 0.04; // Roughly 4-5km boundary spread
    const bbox = `${lat - radius},${lon - radius},${lat + radius},${lon + radius}`;
    
    const query = `[out:json][timeout:25];(node["amenity"="cafe"](${bbox});node["amenity"="library"](${bbox});node["shop"="coffee"](${bbox}););out center 50;`;
    
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
        });
        
        if (!response.ok) throw new Error('Overpass network error');
        
        const data = await response.json();
        const items = (data.elements || []).map((n, idx) => ({
            id: n.id || `osm-${idx}`,
            name: n.tags?.name || 'UNKNOWN ANOMALY',
            coords: [n.lat || 47.615, n.lon || -122.33],
            noise: n.tags?.quiet ? 'SILENT' : 'LIVELY',
            outlets: n.tags?.outlets ? 'ABUNDANT' : 'UNKNOWN',
            distance: `${Math.floor(Math.random() * 15) + 5} MIN`,
            reason: (n.tags?.amenity || 'LOCAL SECTOR').toUpperCase(),
            rating: n.tags?.stars || 'N/A',
            address: n.tags?.addr_street ? `${n.tags.addr_street} ${n.tags.addr_housenumber || ''}`.trim() : ''
        }));
        
        res.json(items);
    } catch (error) {
        console.error("Overpass Fetch Error:", error);
        res.status(500).json({ error: "SCANNER TIMEOUT." });
    }
});

app.listen(PORT, () => {
    console.log(`[SYS] Backend Node Server active on port ${PORT}...`);
    console.log(`[SYS] Gemini API Loaded: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO'}`);
});
