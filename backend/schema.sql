-- ============================================
-- Third Place Finder - MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS third_place_finder;
USE third_place_finder;

-- -------------------------------------------
-- 1. USERS - Guest vs Registered
--    Guests: is_guest=TRUE, no favorites
--    Registered: is_guest=FALSE, can save favs
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100) UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255),
    is_guest        BOOLEAN DEFAULT TRUE,
    session_id      VARCHAR(128) UNIQUE NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------
-- 2. PLACES - Cafes, Libraries, Coworking
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS places (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    category        ENUM('cafe', 'library', 'coworking') NOT NULL,
    address         VARCHAR(500) NOT NULL,
    latitude        DECIMAL(10, 7) NOT NULL,
    longitude       DECIMAL(10, 7) NOT NULL,
    noise_level     ENUM('silent', 'quiet', 'moderate', 'lively') NOT NULL,
    group_friendly  BOOLEAN DEFAULT FALSE,
    has_outlets     BOOLEAN DEFAULT TRUE,
    has_wifi        BOOLEAN DEFAULT TRUE,
    serves_coffee   BOOLEAN DEFAULT FALSE,
    opening_hours   VARCHAR(255),
    description     TEXT,
    image_url       VARCHAR(500),
    avg_rating      DECIMAL(2, 1) DEFAULT 0.0,
    review_count    INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------
-- 3. FAVORITES - Only registered users can save
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    place_id        INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE KEY unique_fav (user_id, place_id)
);

-- -------------------------------------------
-- 4. USER_PREFERENCES - Onboarding answers
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    noise_pref      ENUM('silent', 'quiet', 'moderate', 'lively'),
    group_size      ENUM('solo', 'duo', 'small_group', 'large_group'),
    time_of_day     ENUM('morning', 'afternoon', 'evening', 'late_night'),
    needs_outlets   BOOLEAN DEFAULT FALSE,
    needs_caffeine  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------
-- 5. REVIEWS
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    place_id        INT NOT NULL,
    rating          TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (user_id, place_id)
);

-- -------------------------------------------
-- 6. AMBIENT_PRESETS - Saved mixer configs
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS ambient_presets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    preset_name     VARCHAR(100) NOT NULL,
    rain_volume     DECIMAL(3, 2) DEFAULT 0.00,
    chatter_volume  DECIMAL(3, 2) DEFAULT 0.00,
    fireplace_volume DECIMAL(3, 2) DEFAULT 0.00,
    street_volume   DECIMAL(3, 2) DEFAULT 0.00,
    lofi_volume     DECIMAL(3, 2) DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
