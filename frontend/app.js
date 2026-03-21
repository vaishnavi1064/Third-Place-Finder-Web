// --- State & Constants ---
const questions = [
    {
        id: 'noise',
        text: "INITIATING SPOT_SCOUT V1.0...\nHOW MUCH NOISE CAN YOU TOLERATE?",
        options: ["SILENCE (LIBRARY)", "BACKGROUND CHATTER", "LIVELY/LOUD"]
    },
    {
        id: 'group_size',
        text: "ACKNOWLEDGED. ARE YOU FLYING SOLO OR BRINGING A CREW?",
        options: ["SOLO", "PAIR", "GROUP OF 3-4", "MASSIVE (5+)"]
    },
    {
        id: 'time',
        text: "INPUT TIME OF OPERATION:",
        options: ["MORNING RUSH", "AFTERNOON CHILL", "EVENING BURN", "LATE NIGHT"]
    },
    {
        id: 'outlets',
        text: "BATTERY STATUS CRITICAL?",
        options: ["MUST HAVE OUTLETS", "A FEW HOURS LEFT", "FULLY CHARGED"]
    },
    {
        id: 'caffeine',
        text: "FINAL PARAMETER: CAFFEINE REQUIREMENTS?",
        options: ["SPECIALTY COFFEE", "ANY CAFFEINE", "JUST A TABLE", "FOOD IS PRIORITY"]
    }
];

let currentStep = 0;
let userPrefs = {};
let map = null;
let markers = [];
let currentVenues = [];

// --- Google Places data (requires API key) ---
const GOOGLE_PLACES_API_KEY = ""; // Insert your key here
const GOOGLE_PLACES_ENABLED = Boolean(GOOGLE_PLACES_API_KEY);

function _userPrefsToKeyword() {
    const values = Object.values(userPrefs)
        .map(v => v.toString().replace(/[^a-zA-Z ]/g, ''))
        .join(' ')
        .toLowerCase();
    if (values.includes('library')) return 'study library';
    if (values.includes('coffee')) return 'coffee shop';
    if (values.includes('chat')) return 'cafe';
    return 'cafe';
}

async function fetchGooglePlaces(lat, lng, radius = 2000) {
    if (!GOOGLE_PLACES_ENABLED) {
        console.warn('Google Places disabled: add API key');
        return null;
    }

    const keyword = encodeURIComponent(_userPrefsToKeyword());
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=cafe&keyword=${keyword}&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Places API network response failed');
        const data = await response.json();
        if (data.status !== 'OK') {
            console.warn('Places API status', data.status, data.error_message);
            return null;
        }

        return data.results.map((place, idx) => ({
            id: place.place_id || `google-${idx}`,
            name: place.name,
            coords: [place.geometry.location.lat, place.geometry.location.lng],
            noise: 'UNKNOWN',
            outlets: 'UNKNOWN',
            distance: `${Math.round(place.vicinity ? 1 : 1)} MIX`,
            reason: place.types ? place.types.join(', ') : 'Real-time venue from Google Places',
            rating: place.rating || 'N/A',
            address: place.vicinity || ''
        }));
    } catch (error) {
        console.error('Google Places fetch failed', error);
        return null;
    }
}

async function fetchSeattlePlacesOverpass() {
    const bbox = '47.495,-122.435,47.735,-122.235';
    const query = `[
        out:json][timeout:25];
        (
            node["amenity"="cafe"](${bbox});
            node["amenity"="library"](${bbox});
            node["shop"="coffee"](${bbox});
            node["cuisine"="coffee_shop"](${bbox});
        );
        out center 200;
    `;

    try {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
        });
        if (!resp.ok) throw new Error('Overpass network error');
        const rjson = await resp.json();

        const nodes = rjson.elements || [];
        if (!nodes.length) return null;

        const items = nodes.slice(0, 120).map((node, idx) => ({
            id: node.id || `osm-${idx}`,
            name: node.tags && (node.tags.name || 'Unnamed Spot'),
            coords: [node.lat || node.center?.lat || 47.615, node.lon || node.center?.lon || -122.33],
            noise: node.tags?.quiet ? node.tags.quiet : 'unknown',
            outlets: node.tags?.outlets || 'unknown',
            distance: 'TBD',
            reason: node.tags?.amenity ? node.tags.amenity : 'Cafe/Library from OpenStreetMap',
            rating: node.tags?.stars || 'N/A',
            address: node.tags?.addr_full || `${node.tags?.addr_street || ''} ${node.tags?.addr_housenumber || ''}`.trim(),
            source: 'osm'
        }));

        return items;
    } catch (error) {
        console.error('Overpass fetch failed', error);
        return null;
    }
}

// --- Mock Data ---
const mockVenues = [
    {
        id: 1,
        name: "ANALOG COFFEE",
        coords: [47.6163, -122.3263],
        noise: "CHATTER",
        outlets: "SOME OUTLETS",
        distance: "12 MIN WALK",
        reason: "LEGENDARY COLD BREW AND AMBIENT VINYL RECORDS PROVIDE PERFECT FOCUS NOISE."
    },
    {
        id: 2,
        name: "SEATTLE PUBLIC LIBRARY",
        coords: [47.6067, -122.3325],
        noise: "SILENCE",
        outlets: "MANY OUTLETS",
        distance: "5 MIN WALK",
        reason: "LEVEL 10 READING ROOM OFFERS STUNNING VIEWS AND GUARANTEED SILENCE."
    },
    {
        id: 3,
        name: "ARMISTICE ROASTER",
        coords: [47.6322, -122.3168],
        noise: "CHATTER",
        outlets: "MANY OUTLETS",
        distance: "18 MIN WALK",
        reason: "SPACIOUS LAYOUT WITH PLENTY OF WALL OUTLETS AND TOP-TIER ESPRESSO."
    }
];

// --- DOM Elements ---
const chatMessages = document.getElementById('chat-messages');
const quickReplies = document.getElementById('quick-replies');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const submitBtn = document.getElementById('submit-btn');
const mapOverlay = document.getElementById('map-overlay');
const resultsContainer = document.getElementById('results-container');
const resultsList = document.getElementById('results-list');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    startChat();
    initVirtualCafe();
    initResizers();

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = chatInput.value.trim();
        if (val) handleUserResponse(val);
    });
});

// --- Virtual Cafe / Audio Logic ---
function initVirtualCafe() {
    // Sliders
    const setupAudio = (sliderId, audioId) => {
        const slider = document.getElementById(sliderId);
        const audio = document.getElementById(audioId);
        
        slider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            audio.volume = vol;
            if (vol > 0 && audio.paused) {
                audio.play().catch(err => console.log('Audio autoplay blocked', err));
            } else if (vol === 0 && !audio.paused) {
                audio.pause();
            }
        });
    };

    setupAudio('vol-rain', 'audio-rain');
    setupAudio('vol-chatter', 'audio-chatter');
    setupAudio('vol-fire', 'audio-fire');
    setupAudio('vol-street', 'audio-street');

    // Music Player
    const musicAudio = document.getElementById('audio-music');
    const musicVol = document.getElementById('vol-music');
    const playBtn = document.getElementById('play-music-btn');

    musicAudio.volume = 0.5;
    musicVol.addEventListener('input', (e) => musicAudio.volume = parseFloat(e.target.value));

    playBtn.addEventListener('click', () => {
        if (musicAudio.paused) {
            musicAudio.play().then(() => {
                playBtn.innerText = "PAUSE";
                playBtn.classList.replace('bg-retro-btn', 'bg-[#a2e4b8]');
            }).catch(e => console.log('Playback blocked', e));
        } else {
            musicAudio.pause();
            playBtn.innerText = "PLAY";
            playBtn.classList.replace('bg-[#a2e4b8]', 'bg-retro-btn');
        }
    });
}

// --- Map Logic ---
let lightLayer = null;
let darkLayer = null;
let activeBaseLayer = 'light';

function initMap() {
    map = L.map('map', { zoomControl: true }).setView([47.615, -122.33], 13);

    darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    });

    lightLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    });

    lightLayer.addTo(map);
    activeBaseLayer = 'light';

    const baseMaps = {
        "Day Map": lightLayer,
        "Night Map": darkLayer
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    addMapEvents();
    addMapControls();
}

function addMapEvents() {
    map.on('click', (e) => {
        const popup = L.popup({ closeButton: false, autoClose: true })
            .setLatLng(e.latlng)
            .setContent(`<div style="font-family:'VT323', monospace; font-size:14px; color:#11111b;">You clicked at<br>${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}</div>`)
            .openOn(map);
    });

    map.on('layeradd', (e) => {
        if (e.layer === darkLayer) {
            activeBaseLayer = 'dark';
            document.getElementById('toggle-map-theme').innerText = 'LIGHT MODE';
            document.getElementById('map-wrapper').classList.add('dark-mode');
            document.getElementById('map-wrapper').classList.remove('light-mode');
        } else if (e.layer === lightLayer) {
            activeBaseLayer = 'light';
            document.getElementById('toggle-map-theme').innerText = 'DARK MODE';
            document.getElementById('map-wrapper').classList.add('light-mode');
            document.getElementById('map-wrapper').classList.remove('dark-mode');
        }
    });
}

function addMapControls() {
    const toggleBtn = document.getElementById('toggle-map-theme');
    const locateBtn = document.getElementById('locate-btn');
    const contrastBtn = document.getElementById('toggle-global-contrast');
    const searchInput = document.getElementById('map-search');

    toggleBtn.addEventListener('click', () => {
        if (activeBaseLayer === 'light') {
            map.addLayer(darkLayer);
            map.removeLayer(lightLayer);
            activeBaseLayer = 'dark';
            toggleBtn.innerText = 'LIGHT MODE';
            document.getElementById('map-wrapper').classList.add('dark-mode');
            document.getElementById('map-wrapper').classList.remove('light-mode');
        } else {
            map.addLayer(lightLayer);
            map.removeLayer(darkLayer);
            activeBaseLayer = 'light';
            toggleBtn.innerText = 'DARK MODE';
            document.getElementById('map-wrapper').classList.add('light-mode');
            document.getElementById('map-wrapper').classList.remove('dark-mode');
        }
    });

    locateBtn.addEventListener('click', locateUser);

    contrastBtn.addEventListener('click', () => {
        const body = document.body;
        const isHigh = body.classList.toggle('high-contrast');
        contrastBtn.innerText = isHigh ? 'NORMAL CONTRAST' : 'HIGH CONTRAST';
        contrastBtn.classList.toggle('bg-[#a2e4b8]', isHigh);
        contrastBtn.classList.toggle('bg-retro-btn', !isHigh);

        // Improve map overlay readability in real time
        if (isHigh) {
            document.getElementById('map-wrapper').classList.add('light-mode');
            document.getElementById('map-wrapper').classList.remove('dark-mode');
        } else {
            if (activeBaseLayer === 'dark') {
                document.getElementById('map-wrapper').classList.add('dark-mode');
                document.getElementById('map-wrapper').classList.remove('light-mode');
            } else {
                document.getElementById('map-wrapper').classList.add('light-mode');
                document.getElementById('map-wrapper').classList.remove('dark-mode');
            }
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlace(searchInput.value.trim());
        }
    });
}

function locateUser() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported in this browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 14);

        const locator = L.circle([latitude, longitude], {
            color: '#a2e4b8',
            fillColor: '#a2e4b8',
            fillOpacity: 0.35,
            radius: 60
        }).addTo(map);

        setTimeout(() => map.removeLayer(locator), 5000);
    }, (err) => {
        alert('Unable to retrieve your location: ' + err.message);
    });
}

async function searchPlace(query) {
    if (!query) return;

    addMessage(`SEARCHING FOR: ${query}`, 'ai');

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await response.json();

        if (!data.length) {
            addMessage('NO MATCH FOUND, TRY ANOTHER INPUT.', 'ai');
            return;
        }

        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        map.flyTo([lat, lon], 15);

        L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'map-search-pin',
                html: '<div style="width:22px;height:22px;background:#f9e2af;border:3px solid #11111b;border-radius:50%;box-shadow:2px 2px 0px #11111b;"></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            })
        }).addTo(map).bindPopup(`<b>${place.display_name}</b>`).openPopup();

        addMessage(`LOCATION FOUND: ${place.display_name}`, 'ai');
    } catch (error) {
        console.error(error);
        addMessage('SEARCH FAILED. CHECK NETWORK CONNECTION.', 'ai');
    }
}


function renderMapPins(venues) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const icon = L.divIcon({
        className: 'custom-pin',
        html: `
            <div class="cursor-pointer">
                <div class="w-8 h-8 bg-retro-window text-retro-border border-4 border-retro-border flex items-center justify-center pixel-shadow relative text-lg font-bold">
                    X
                </div>
            </div>
        `,
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
    });

    const bounds = L.latLngBounds();
    venues.forEach((v, index) => {
        const marker = L.marker(v.coords, { icon }).addTo(map);
        const popupContent = `
            <div class="p-2 min-w-[150px] font-sans">
                <div class="border-b-4 border-retro-border pb-1 mb-2">
                    <h3 class="font-bold text-retro-border text-lg tracking-wider">${v.name}</h3>
                </div>
                <p class="text-sm font-bold bg-retro-border text-retro-window px-1 inline-block">${v.distance}</p>
            </div>
        `;
        marker.bindPopup(popupContent, { closeButton: false });
        markers.push(marker);
        bounds.extend(v.coords);
    });

    if (venues.length > 0) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
}

// --- Chat Logic ---
function startChat() {
    setTimeout(() => askQuestion(0), 1000);
}

function askQuestion(index) {
    if (index >= questions.length) {
        finishOnboarding();
        return;
    }
    const q = questions[index];
    showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator();
        addMessage(q.text, 'ai');
        renderOptions(q.options);
    }, 800);
}

function handleUserResponse(text) {
    quickReplies.innerHTML = '';
    chatInput.value = '';

    if (currentStep < questions.length) {
        chatInput.disabled = true;
        submitBtn.disabled = true;
        addMessage(text, 'user');
        userPrefs[questions[currentStep].id] = text;
        currentStep++;
        askQuestion(currentStep);
    } else {
        addMessage(text, 'user');
        processStudyBuddyResponse(text);
    }
}

function processStudyBuddyResponse(text) {
    const normalized = text.toLowerCase();

    if (normalized.includes('recommend') || normalized.includes('quiet') || normalized.includes('outlets')) {
        const filtered = currentVenues.length ? currentVenues : mockVenues;
        let picks = filtered;

        if (normalized.includes('quiet')) {
            picks = filtered.filter(v => /library|study|silent|quiet/.test(`${v.reason} ${v.name}`.toLowerCase()));
        } else if (normalized.includes('outlet')) {
            picks = filtered.filter(v => /outlet|plug|power/.test(`${v.reason} ${v.name} ${v.outlets}`.toLowerCase()));
        } else if (normalized.includes('rated')) {
            picks = filtered.slice().sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        }

        if (!picks.length) {
            addMessage('I could not find a perfect match, but I am here to keep studying with you! Try another request like "fewer crowds" or "more coffee".', 'ai');
            renderQuickChatActions();
            return;
        }

        const top = picks.slice(0, 3);
        top.forEach((place, i) => {
            addMessage(`#${i+1} ${place.name} (${place.rating || 'N/A'}): ${place.reason}.`, 'ai');
        });
        renderMapPins(top);
        renderResultCards(top);
        addMessage('Click a card to get details. Tap navigate to start your route.', 'ai');
        renderQuickChatActions();

        return;
    }

    if (normalized.includes('hi') || normalized.includes('hello') || normalized.includes('buddy')) {
        addMessage('Hey study buddy! I can help you find spots, compare cafes, or route you to a place. Ask me anything!', 'ai');
        renderQuickChatActions();
        return;
    }

    addMessage('Nice question! I am currently learning while helping you pick the best spot. Try asking for "quiet spots near me" or "cheapest coffee".', 'ai');
    renderQuickChatActions();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function finishOnboarding() {
    showTypingIndicator();
    await sleep(1000);

    removeTypingIndicator();
    addMessage("PROCESSING DATA...", 'ai');
    showTypingIndicator();

    await sleep(1500);

    removeTypingIndicator();
    addMessage("MATCHES FOUND. DOWNLOADING MAP DATA...", 'ai');

    mapOverlay.classList.add('opacity-0', 'pointer-events-none');
    resultsContainer.classList.remove('hidden');

    const center = map.getCenter();
    let venues = null;

    if (GOOGLE_PLACES_ENABLED) {
        addMessage('FETCHING LIVE VENUES FROM GOOGLE PLACES...', 'ai');
        venues = await fetchGooglePlaces(center.lat, center.lng, 5000);
    }

    if ((!venues || !venues.length) && !GOOGLE_PLACES_ENABLED) {
        addMessage('LOADING SEATTLE LIVE DATA FROM OPENSTREETMAP (Overpass)...', 'ai');
        venues = await fetchSeattlePlacesOverpass();
    }

    if (!venues || !venues.length) {
        addMessage('LIVE DATA NOT AVAILABLE; SHOWING LOCAL SAMPLE.', 'ai');
        venues = mockVenues;
    }

    // Match venues to user preferences from onboarding inputs
    currentVenues = matchVenuesToPreferences(venues, userPrefs);
    if (!currentVenues.length) currentVenues = venues;

    renderMapPins(currentVenues);
    renderResultCards(currentVenues);

    chatInput.disabled = false;
    submitBtn.disabled = false;
    chatInput.placeholder = "Ask away, study buddy...";
    renderQuickChatActions();
}

function matchVenuesToPreferences(venues, prefs) {
    const keywords = Object.values(prefs).join(' ').toLowerCase();
    return venues.filter(v => {
        const text = `${v.name} ${v.reason} ${v.address || ''}`.toLowerCase();
        return keywords.split(/\s+/).some(k => k && text.includes(k));
    }).slice(0, 100);
}

function renderQuickChatActions() {
    const actions = ['RECOMMEND QUIET SPOTS', 'FIND PLACES WITH OUTLETS', 'SHOW MOST RATED'];
    quickReplies.innerHTML = '';
    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-2 bg-retro-bg hover:bg-white border-4 border-retro-border text-retro-text hover:text-retro-border text-lg font-bold transition-none pixel-btn-shadow retro-active uppercase";
        btn.innerText = act;
        btn.onclick = () => processStudyBuddyResponse(act);
        quickReplies.appendChild(btn);
    });
}

// --- UI Helpers ---
function addMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex w-full mb-4 message-bubble ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    if (sender === 'ai') {
        wrapper.innerHTML = `
            <div class="flex items-start max-w-[85%]">
                <div class="bubble-ai p-3 inline-block">
                     <p class="text-xl leading-relaxed whitespace-pre-line">${text}</p>
                </div>
            </div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="flex items-start max-w-[85%]">
                <div class="bubble-user p-3 inline-block">
                    <p class="text-xl">${text}</p>
                </div>
            </div>
        `;
    }
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.id = 'typing-indicator';
    wrapper.className = `flex w-full mb-4 justify-start message-bubble`;
    wrapper.innerHTML = `
        <div class="flex items-start max-w-[80%]">
            <div class="bubble-ai p-3 px-4 flex items-center gap-1.5 inline-block">
                 <span class="text-xl animate-pulse">_</span>
            </div>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function renderOptions(options) {
    quickReplies.innerHTML = '';
    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-2 bg-retro-bg hover:bg-white border-4 border-retro-border text-retro-text hover:text-retro-border text-lg font-bold transition-none pixel-btn-shadow retro-active uppercase";
        btn.innerText = opt;
        btn.onclick = () => handleUserResponse(opt);
        quickReplies.appendChild(btn);
    });
}

async function fetchPlaceDetails(placeId) {
    if (!GOOGLE_PLACES_ENABLED || !placeId) {
        return null;
    }
    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,reviews,formatted_address,formatted_phone_number,opening_hours,website&key=${GOOGLE_PLACES_API_KEY}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Google Place Details network error');
        const data = await response.json();
        if (data.status !== 'OK') {
            console.warn('Place details status', data.status, data.error_message);
            return null;
        }
        return data.result;
    } catch (error) {
        console.error('Place details fetch failed', error);
        return null;
    }
}

function showPlaceReviews(place) {
    const reviewContent = place.reviews && place.reviews.length > 0
        ? place.reviews.slice(0, 3).map(r => `<p class="text-xs text-retro-border border-b border-retro-border pb-1 mb-1"><strong>${r.author_name}</strong> (${r.rating}/5): ${r.text}</p>`).join('')
        : '<p class="text-xs text-retro-border">No review content available in this mode.</p>';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4';
    modal.innerHTML = `
        <div class="bg-white border-4 border-retro-border p-4 w-full max-w-2xl text-black">
            <h3 class="font-bold text-xl mb-2">${place.name} - Reviews</h3>
            ${reviewContent}
            <button id="close-reviews" class="mt-3 px-3 py-2 bg-retro-btn border-2 border-retro-border font-bold">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('close-reviews').addEventListener('click', () => modal.remove());
}

function routeToSpot(destCoords) {
    if (!navigator.geolocation) {
        alert('Geolocation not supported. Please use your browser or device settings.');
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const gmapUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${destCoords[0]},${destCoords[1]}/`;
        window.open(gmapUrl, '_blank');
    }, (err) => {
        alert('Unable to get your location: ' + err.message);
    }, { timeout: 10000 });
}

function renderResultCards(venues) {
    resultsList.innerHTML = '';
    venues.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = "p-3 result-card cursor-pointer retro-active";
        card.tabIndex = 0;
        card.onclick = () => {
            map.flyTo(v.coords, 16, { animate: true, duration: 1 });
            markers[index].openPopup();
        };

        const ratingLabel = v.rating ? `${v.rating} ★` : 'No rating';
        const detailsButton = v.id && GOOGLE_PLACES_ENABLED ? '<button class="mt-2 px-2 py-1 bg-retro-btn border-2 border-retro-border text-xs font-bold" data-placeref="' + v.id + '">REVIEWS</button>' : '';
        const navButton = `<button class="mt-2 ml-2 px-2 py-1 bg-[#5cd65c] border-2 border-retro-border text-xs font-bold" data-navigate="${index}">NAVIGATE</button>`;

        card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-retro-accent border-4 border-retro-border text-retro-border flex items-center justify-center font-bold text-lg flex-shrink-0">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-2 border-b-4 border-retro-border pb-1">
                        <h3 class="font-bold text-retro-border text-xl">${v.name}</h3>
                        <span class="text-xs font-bold text-retro-text bg-retro-border px-1 uppercase">${ratingLabel}</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-2">
                        <span class="px-1 bg-retro-window border-2 border-retro-border text-retro-border text-xs font-bold">${v.noise || 'UNKNOWN'}</span>
                        <span class="px-1 bg-[#a2e4b8] border-2 border-retro-border text-retro-border text-xs font-bold">${v.outlets || 'UNKNOWN'}</span>
                    </div>
                    <div class="bg-white p-2 border-4 border-retro-border">
                        <p class="text-sm text-retro-border font-bold uppercase">${v.reason}</p>
                        <p class="text-xs text-retro-border mt-1">${v.address || ''}</p>
                    </div>
                    <div class="mt-2 flex gap-2">
                        ${detailsButton}
                        ${navButton}
                    </div>
                </div>
            </div>
        `;

        resultsList.appendChild(card);

        if (detailsButton) {
            const reviewBtn = card.querySelector('[data-placeref]');
            reviewBtn.addEventListener('click', async (event) => {
                event.stopPropagation();
                addMessage(`FETCHING REVIEWS FOR ${v.name}...`, 'ai');
                const details = await fetchPlaceDetails(v.id);
                if (details) {
                    v.reviews = details.reviews || [];
                    v.name = details.name || v.name;
                    showPlaceReviews({ ...v, ...details });
                } else {
                    addMessage('REVIEWS UNAVAILABLE, USING LOCAL SAMPLE REVIEWS', 'ai');
                    showPlaceReviews(v);
                }
            });
        }

        const navBtn = card.querySelector('[data-navigate]');
        if (navBtn) {
            navBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                routeToSpot(v.coords);
            });
        }
    });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Resizer Logic ---
function initResizers() {
    const leftPane = document.getElementById('left-pane');
    const rightPane = document.getElementById('right-pane');
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');

    let isResizingLeft = false;
    let isResizingRight = false;

    if (!resizerLeft || !resizerRight) return;

    resizerLeft.addEventListener('mousedown', (e) => {
        isResizingLeft = true;
        document.body.style.cursor = 'col-resize';
        document.getElementById('map').style.pointerEvents = 'none';
        e.preventDefault();
    });

    resizerRight.addEventListener('mousedown', (e) => {
        isResizingRight = true;
        document.body.style.cursor = 'col-resize';
        document.getElementById('map').style.pointerEvents = 'none';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizingLeft && !isResizingRight) return;

        if (isResizingLeft) {
            const newWidth = Math.max(300, Math.min(800, e.clientX));
            leftPane.style.width = newWidth + 'px';
        } else if (isResizingRight) {
            const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
            rightPane.style.width = newWidth + 'px';
        }
        
        if (map) map.invalidateSize();
    });

    window.addEventListener('mouseup', () => {
        if (isResizingLeft || isResizingRight) {
            isResizingLeft = false;
            isResizingRight = false;
            document.body.style.cursor = '';
            document.getElementById('map').style.pointerEvents = '';
            if (map) map.invalidateSize();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            leftPane.style.width = '';
            rightPane.style.width = '';
        }
    });
}
