-- ============================================
-- Third Place Finder - Seed Data
-- Pre-loaded users, places, favorites, reviews
-- for demo/presentation purposes
-- ============================================

USE third_place_finder;

-- -------------------------------------------
-- PLACES (5 entries - ready for demo)
-- -------------------------------------------
INSERT INTO places (id, name, category, address, latitude, longitude, noise_level, group_friendly, has_outlets, has_wifi, serves_coffee, opening_hours, description, avg_rating, review_count) VALUES

(1, 'Elm Coffee Roasters', 'cafe',
 '240 2nd Ave S, Seattle, WA 98104',
 47.5995, -122.3322, 'moderate', FALSE, TRUE, TRUE, TRUE,
 'Mon-Sun 7AM-5PM',
 'Minimalist Pioneer Square cafe with excellent single-origin pour-overs. Great for solo deep work with plenty of outlets.',
 4.5, 2),

(2, 'Seattle Central Library', 'library',
 '1000 4th Ave, Seattle, WA 98104',
 47.6067, -122.3326, 'silent', TRUE, TRUE, TRUE, FALSE,
 'Mon-Thu 10AM-8PM, Fri-Sat 10AM-6PM, Sun 12-6PM',
 'Rem Koolhaas architectural icon. Multiple quiet floors, reading rooms, and free meeting spaces. Perfect for deep focus.',
 4.8, 2),

(3, 'Victrola Coffee Roasters', 'cafe',
 '310 E Pike St, Seattle, WA 98122',
 47.6145, -122.3265, 'lively', TRUE, TRUE, TRUE, TRUE,
 'Mon-Sun 6AM-8PM',
 'Capitol Hill staple with open mic nights. Buzzy atmosphere, perfect if you thrive on background energy.',
 4.2, 1),

(4, 'Office Nomads', 'coworking',
 '1617 Boylston Ave, Seattle, WA 98122',
 47.6164, -122.3224, 'quiet', TRUE, TRUE, TRUE, TRUE,
 'Mon-Fri 9AM-6PM',
 'Intimate Capitol Hill coworking space. Tight-knit community vibe with affordable day passes and strong WiFi.',
 4.6, 1),

(5, 'Cafe Allegro', 'cafe',
 '4214 University Way NE, Seattle, WA 98105',
 47.6585, -122.3131, 'quiet', FALSE, TRUE, TRUE, TRUE,
 'Mon-Sun 6:30AM-10PM',
 'Seattle oldest espresso bar tucked in a U-District alley. Classic study spot beloved by UW students.',
 4.4, 1);

-- -------------------------------------------
-- DEMO USERS
-- Password for both: "demo1234"
-- Hash = bcrypt('demo1234')
-- -------------------------------------------

-- Registered user (can save favorites)
INSERT INTO users (id, username, email, password_hash, is_guest, session_id) VALUES
(1, 'shravani', 'shravani@demo.com',
 '$2b$10$48BK3OLVB3gJPDjbGJgr3uAdtHQBKNvA2JwpiXKZPjLiALdgnwZ4G',
 FALSE, 'session-registered-demo-001');

-- Another registered user
INSERT INTO users (id, username, email, password_hash, is_guest, session_id) VALUES
(2, 'aangi', 'aangi@demo.com',
 '$2b$10$48BK3OLVB3gJPDjbGJgr3uAdtHQBKNvA2JwpiXKZPjLiALdgnwZ4G',
 FALSE, 'session-registered-demo-002');

-- Guest user (cannot save favorites)
INSERT INTO users (id, username, email, password_hash, is_guest, session_id) VALUES
(3, NULL, NULL, NULL, TRUE, 'session-guest-demo-003');

-- -------------------------------------------
-- PRE-LOADED FAVORITES (registered users only)
-- -------------------------------------------

-- shravani's favorites
INSERT INTO favorites (user_id, place_id) VALUES (1, 1);  -- Elm Coffee
INSERT INTO favorites (user_id, place_id) VALUES (1, 2);  -- Central Library
INSERT INTO favorites (user_id, place_id) VALUES (1, 4);  -- Office Nomads

-- aangi's favorites
INSERT INTO favorites (user_id, place_id) VALUES (2, 2);  -- Central Library
INSERT INTO favorites (user_id, place_id) VALUES (2, 5);  -- Cafe Allegro

-- -------------------------------------------
-- PRE-LOADED REVIEWS
-- -------------------------------------------
INSERT INTO reviews (user_id, place_id, rating, comment) VALUES
(1, 1, 5, 'Best pour-over in Pioneer Square. I come here every week to study.'),
(1, 2, 5, 'The reading room is magical. Absolute silence, stunning architecture.'),
(2, 2, 4, 'Amazing building but gets crowded on weekends. Go on weekday mornings.'),
(2, 5, 5, 'My go-to study spot in U-District. Cozy alley vibes and great espresso.'),
(1, 4, 4, 'Great community feel. WiFi is fast and the day pass is affordable.'),
(2, 1, 4, 'Solid coffee, good outlets. A bit small but worth it for the quality.'),
(2, 3, 4, 'Love the energy here. Not ideal for quiet studying but great for brainstorming.');

-- -------------------------------------------
-- PRE-LOADED PREFERENCES
-- -------------------------------------------
INSERT INTO user_preferences (user_id, noise_pref, group_size, time_of_day, needs_outlets, needs_caffeine) VALUES
(1, 'quiet', 'solo', 'morning', TRUE, TRUE),
(2, 'moderate', 'duo', 'afternoon', TRUE, TRUE);
