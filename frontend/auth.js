// ============================================
// auth.js - User session & favorites manager
// Loaded AFTER app.js in index.html
// ============================================

const AUTH_API = 'http://localhost:3000/api';

// --- Session Management ---
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('thirdplace_user'));
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem('thirdplace_user');
    window.location.href = 'login.html';
}

// --- Redirect to login if no session ---
(function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    // Inject user bar into the page
    injectUserBar(user);
    // Load favorites if registered
    if (!user.is_guest && user.id) {
        loadUserFavorites(user.id);
    }
})();

// --- User Bar (top-right corner showing who's logged in) ---
function injectUserBar(user) {
    const bar = document.createElement('div');
    bar.id = 'user-bar';
    bar.style.cssText = `
        position: fixed;
        top: 8px;
        right: 8px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #2b2b45;
        border: 3px solid #11111b;
        padding: 6px 12px;
        font-family: 'VT323', monospace;
        box-shadow: 4px 4px 0px #11111b;
    `;

    const isGuest = user.is_guest;
    const displayName = isGuest ? 'GUEST' : user.username.toUpperCase();
    const badge = isGuest
        ? '<span style="color:#f9e2af;">&#x1F440;</span>'
        : '<span style="color:#a2e4b8;">&#x2764;</span>';

    bar.innerHTML = `
        ${badge}
        <span style="color:#f8f8f2; font-size:1.2rem;">${displayName}</span>
        ${!isGuest ? `<button onclick="showMyFavorites()" style="background:#f9e2af; color:#11111b; border:2px solid #11111b; padding:2px 8px; font-family:'VT323',monospace; font-size:1rem; cursor:pointer; font-weight:bold;" title="My Favorites">&#x2B50; FAVS</button>` : ''}
        <button onclick="logout()" style="background:#ffb6c1; color:#11111b; border:2px solid #11111b; padding:2px 8px; font-family:'VT323',monospace; font-size:1rem; cursor:pointer; font-weight:bold;">LOGOUT</button>
    `;

    document.body.appendChild(bar);
}

// --- Favorites ---
let userFavorites = []; // Array of place_ids

async function loadUserFavorites(userId) {
    try {
        const resp = await fetch(`${AUTH_API}/favorites/${userId}`);
        if (!resp.ok) return;
        const data = await resp.json();
        userFavorites = data.favorites.map(f => f.id);
    } catch (err) {
        console.warn('Could not load favorites:', err);
    }
}

async function toggleFavorite(placeId, buttonEl) {
    const user = getCurrentUser();

    if (!user || user.is_guest) {
        alert('&#x26A0; Sign up to save favorites! Guests cannot use this feature.');
        return;
    }

    const isFav = userFavorites.includes(placeId);

    try {
        if (isFav) {
            // Remove
            const resp = await fetch(`${AUTH_API}/favorites/${user.id}/${placeId}`, { method: 'DELETE' });
            if (resp.ok) {
                userFavorites = userFavorites.filter(id => id !== placeId);
                buttonEl.innerHTML = '&#x2661; SAVE';
                buttonEl.style.background = '#cbaacb';
            }
        } else {
            // Add
            const resp = await fetch(`${AUTH_API}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, place_id: placeId })
            });
            if (resp.ok) {
                userFavorites.push(placeId);
                buttonEl.innerHTML = '&#x2605; SAVED';
                buttonEl.style.background = '#f9e2af';
            } else {
                const data = await resp.json();
                if (data.error === 'Guests cannot save favorites. Please sign up to use this feature!') {
                    alert('Sign up to save favorites!');
                }
            }
        }
    } catch (err) {
        console.error('Favorite toggle failed:', err);
    }
}

async function showMyFavorites() {
    const user = getCurrentUser();
    if (!user || user.is_guest || !user.id) return;

    try {
        const resp = await fetch(`${AUTH_API}/favorites/${user.id}`);
        if (!resp.ok) return;
        const data = await resp.json();

        if (data.favorites.length === 0) {
            // Use the chat to show message if addMessage exists
            if (typeof addMessage === 'function') {
                addMessage('NO FAVORITES YET! EXPLORE SPOTS AND HIT THE SAVE BUTTON.', 'ai');
            } else {
                alert('No favorites saved yet!');
            }
            return;
        }

        // Show favorites on the map
        if (typeof markers !== 'undefined' && typeof map !== 'undefined') {
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }

        const venues = data.favorites.map(f => ({
            id: f.id,
            name: f.name,
            coords: [parseFloat(f.latitude), parseFloat(f.longitude)],
            noise: f.noise_level ? f.noise_level.toUpperCase() : 'UNKNOWN',
            outlets: f.has_outlets ? 'HAS OUTLETS' : 'NO OUTLETS',
            reason: f.description || f.category,
            address: f.address,
            rating: f.avg_rating || 'N/A',
            category: f.category
        }));

        if (typeof addMessage === 'function') {
            addMessage(`LOADING YOUR ${data.count} FAVORITE SPOTS...`, 'ai');
        }

        // Use existing renderMapPins if available, otherwise plot manually
        if (typeof currentVenues !== 'undefined') {
            currentVenues = venues;
        }

        // Plot on map
        if (typeof map !== 'undefined' && map) {
            const bounds = [];
            venues.forEach(v => {
                const pixelIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background: #f9e2af;
                        color: #11111b;
                        border: 3px solid #11111b;
                        padding: 2px 6px;
                        font-family: 'Press Start 2P', monospace;
                        font-size: 8px;
                        white-space: nowrap;
                        box-shadow: 3px 3px 0 #11111b;
                    ">&#x2605; ${v.name.substring(0, 15)}</div>`,
                    iconSize: null
                });

                const marker = L.marker(v.coords, { icon: pixelIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family:'VT323',monospace; padding:4px;">
                            <b style="font-size:1.2rem;">${v.name}</b><br>
                            <span>${v.category} | ${v.noise}</span><br>
                            <span>${v.address}</span><br>
                            <span>Rating: ${v.rating}</span>
                        </div>
                    `);
                markers.push(marker);
                bounds.push(v.coords);
            });

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }

    } catch (err) {
        console.error('Error showing favorites:', err);
    }
}

// --- Monkey-patch the venue card renderer to add a Favorite button ---
// We watch for new venue cards being added and inject a fav button
const favObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('venue-card')) {
                injectFavButton(node);
            }
            // Also check children
            if (node.querySelectorAll) {
                node.querySelectorAll('.venue-card').forEach(card => injectFavButton(card));
            }
        });
    });
});

function injectFavButton(card) {
    // Check if already has fav button
    if (card.querySelector('.fav-btn')) return;

    const user = getCurrentUser();
    const buttonContainer = card.querySelector('.mt-2.flex.gap-2') || card.querySelector('.flex.gap-2');
    if (!buttonContainer) return;

    // Try to get place ID from the card
    const nameEl = card.querySelector('.font-title, .text-xl, h3');
    const placeName = nameEl ? nameEl.textContent.trim() : '';

    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn';
    favBtn.style.cssText = `
        background: ${user && !user.is_guest ? '#cbaacb' : '#666'};
        color: #11111b;
        border: 3px solid #11111b;
        padding: 4px 10px;
        font-family: 'VT323', monospace;
        font-size: 1rem;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 2px 2px 0 #11111b;
    `;
    favBtn.innerHTML = '&#x2661; SAVE';
    favBtn.title = user && user.is_guest ? 'Sign up to save favorites!' : 'Save to favorites';

    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!user || user.is_guest) {
            alert('Sign up to save favorites! Guests cannot use this feature.');
            return;
        }
        // We need to find the place in our backend by name
        findAndToggleFavorite(placeName, favBtn);
    });

    buttonContainer.appendChild(favBtn);
}

async function findAndToggleFavorite(placeName, buttonEl) {
    try {
        // Search our backend for this place
        const resp = await fetch(`${AUTH_API}/places`);
        const data = await resp.json();

        // Fuzzy match by name
        const place = data.places.find(p =>
            p.name.toLowerCase().includes(placeName.toLowerCase().substring(0, 10)) ||
            placeName.toLowerCase().includes(p.name.toLowerCase().substring(0, 10))
        );

        if (place) {
            toggleFavorite(place.id, buttonEl);
        } else {
            alert('This place is not in our database yet.');
        }
    } catch (err) {
        console.error('Error finding place:', err);
    }
}

// Start observing the chat messages area for new venue cards
document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-messages');
    if (chatArea) {
        favObserver.observe(chatArea, { childList: true, subtree: true });
    }

    // Also observe the results list if it exists
    const resultsList = document.getElementById('results-list');
    if (resultsList) {
        favObserver.observe(resultsList, { childList: true, subtree: true });
    }
});
