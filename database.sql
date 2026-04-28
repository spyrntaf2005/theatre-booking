-- ============================================
-- THEATRE BOOKING APP — DATABASE SCHEMA
-- CN6035 Mobile & Distributed Systems
-- ============================================

CREATE DATABASE IF NOT EXISTS theatre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE theatre_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    external_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- THEATRES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS theatres (
    theatre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SHOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shows (
    show_id INT AUTO_INCREMENT PRIMARY KEY,
    theatre_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    age_rating VARCHAR(10) DEFAULT 'ALL',
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE CASCADE
);

-- ============================================
-- SHOWTIMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    total_seats INT NOT NULL DEFAULT 100,
    available_seats INT NOT NULL DEFAULT 100,
    price_standard DECIMAL(8,2) NOT NULL DEFAULT 15.00,
    price_vip DECIMAL(8,2) NOT NULL DEFAULT 30.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE
);

-- ============================================
-- SEATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_category ENUM('standard', 'vip') DEFAULT 'standard',
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat (showtime_id, seat_number)
);

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    seats_reserved JSON NOT NULL COMMENT 'Array of seat numbers',
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE
);

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO theatres (name, location, description) VALUES
('Εθνικό Θέατρο', 'Αθήνα, Αγίου Κωνσταντίνου 22', 'Το Εθνικό Θέατρο της Ελλάδας, ιδρύθηκε το 1900.'),
('Θέατρο Βεάκειο', 'Πειραιάς, Λόφος Προφήτη Ηλία', 'Υπαίθριο θέατρο με θέα στο Σαρωνικό κόλπο.'),
('Μέγαρο Μουσικής', 'Αθήνα, Βασ. Σοφίας & Κόκκαλη', 'Πολιτιστικό κέντρο με πολλαπλές αίθουσες.'),
('Θέατρο Δώρα Στράτου', 'Αθήνα, Λόφος Φιλοπάππου', 'Γνωστό για παραστάσεις ελληνικού παραδοσιακού χορού.');

INSERT INTO shows (theatre_id, title, description, duration, age_rating) VALUES
(1, 'Αντιγόνη', 'Η διάσημη τραγωδία του Σοφοκλή σε σύγχρονη σκηνοθεσία.', 120, 'ALL'),
(1, 'Ορέστης', 'Κλασική τραγωδία του Ευριπίδη.', 105, '14+'),
(2, 'Οιδίπους Τύραννος', 'Αριστουργηματική τραγωδία υπό το φως των αστεριών.', 130, 'ALL'),
(3, 'Ρωμαίος και Ιουλιέτα', 'Η αγαπημένη ιστορία του Shakespeare σε ελληνική απόδοση.', 150, 'ALL'),
(3, 'Χαμός στο Χωριό', 'Σύγχρονη ελληνική κωμωδία.', 90, 'ALL'),
(4, 'Ελληνικοί Παραδοσιακοί Χοροί', 'Βραδιά παραδοσιακών χορών από όλη την Ελλάδα.', 100, 'ALL');

INSERT INTO showtimes (show_id, show_date, show_time, total_seats, available_seats, price_standard, price_vip) VALUES
(1, '2026-05-10', '20:00:00', 200, 200, 20.00, 40.00),
(1, '2026-05-11', '20:00:00', 200, 200, 20.00, 40.00),
(1, '2026-05-17', '20:00:00', 200, 180, 20.00, 40.00),
(2, '2026-05-15', '21:00:00', 150, 150, 18.00, 35.00),
(3, '2026-05-20', '21:30:00', 300, 300, 15.00, 30.00),
(3, '2026-05-21', '21:30:00', 300, 250, 15.00, 30.00),
(4, '2026-05-25', '20:30:00', 400, 400, 25.00, 50.00),
(5, '2026-05-12', '19:00:00', 250, 250, 22.00, 45.00),
(6, '2026-06-01', '21:00:00', 500, 500, 12.00, 25.00);
