# 🎭 Theatre Booking App (CN6035)

Μια ολοκληρωμένη full-stack mobile εφαρμογή για κράτηση θέσεων σε θεατρικές παραστάσεις, αναπτυγμένη στα πλαίσια πανεπιστημιακής εργασίας (CN6035).

## 🚀 Τεχνολογίες που χρησιμοποιήθηκαν

- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Node.js, Express.js
- **Βάση Δεδομένων**: MariaDB
- **Ασφάλεια**: JWT (JSON Web Tokens) για Authentication, Bcrypt (Password Hashing)
- **Επικοινωνία**: Axios (με interceptors για ασφαλή HTTP requests)

## ✨ Βασικά Χαρακτηριστικά (Features)

- 🔐 **Εγγραφή / Σύνδεση Χρηστών**: Ασφαλής ταυτοποίηση με JWT.
- 🎭 **Προβολή Παραστάσεων**: Λίστα με διαθέσιμες παραστάσεις και φιλτράρισμα ανά θέατρο.
- 💺 **Διαδραστικός Χάρτης Θέσεων (Seat Map)**: Επιλογή θέσεων (Standard / VIP) με έλεγχο διαθεσιμότητας σε πραγματικό χρόνο (concurrent booking lock).
- 🎟️ **Διαχείριση Κρατήσεων**: Προβολή ιστορικού κρατήσεων στο Προφίλ του χρήστη.
- 🗑️ **Ακύρωση & Διαγραφή**: Ακύρωση μελλοντικών κρατήσεων και swipe-to-delete οριστική διαγραφή για τις ακυρωμένες.

## 🗂️ Σχεδιασμός Βάσης Δεδομένων (ER Diagram)
![ER Diagram](./screenshots/ER_Diagram.png)

## 📱 Παρουσίαση Εφαρμογής
### Σύνδεση Χρήστη
![Login Screen](./screenshots/App_Login.png)

### 2. Αρχική Οθόνη (Λίστα Παραστάσεων)
![Home Screen](./screenshots/App_Home.png)

### 3. Διαδραστικός Χάρτης Κρατήσεων (Seat Map)
![Seat Map](./screenshots/App_SeatMap.png)

### 4. Προφίλ Χρήστη (Διαχείριση Κρατήσεων)
![Profile Screen](./screenshots/App_Profile.png)

## 📮 API Testing (Postman)
Η λειτουργία του Backend (REST API) έχει δοκιμαστεί επιτυχώς με το Postman:

### 1. Ταυτοποίηση (Login)
![Postman Login](./screenshots/Postman_Login.png)

### 2. Ανάκτηση Παραστάσεων (Get Shows)
![Postman Get Shows](./screenshots/Postman_Get_Shows.png)

### 3. Δημιουργία Κράτησης (Create Reservation)
![Postman Create Reservation](./screenshots/Postman_Create_Reservation.png)

---

## 🛠️ Οδηγίες Εγκατάστασης (Setup)

Για να τρέξετε την εφαρμογή τοπικά, ακολουθήστε τα παρακάτω βήματα:

### 1. Βάση Δεδομένων (MAMP)
1. Εκκινήστε το MAMP (Apache & MySQL).
2. Ανοίξτε το phpMyAdmin (`http://localhost:8888/phpmyadmin`).
3. Δημιουργήστε μια νέα βάση με όνομα `theatre_db`.
4. Κάντε import το αρχείο `database.sql` που βρίσκεται στον κεντρικό φάκελο.

### 2. Backend (REST API)
Ανοίξτε ένα τερματικό στον φάκελο `backend` και τρέξτε:
```bash
npm install
npm run dev
```
Το API θα τρέχει στο `http://localhost:3000`.

### 3. Frontend (Mobile App)
Ανοίξτε ένα δεύτερο τερματικό στον φάκελο `frontend` και τρέξτε:
```bash
npm install
npx expo start
```
Σκανάρετε το QR Code με την εφαρμογή **Expo Go** (Android/iOS) στο κινητό σας, έχοντας το κινητό στο ίδιο WiFi με τον υπολογιστή.

---
*Ανάπτυξη από: [Το Όνομά σου]*
