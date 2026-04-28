const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// POST /reservations — Δημιουργία κράτησης
router.post('/', verifyToken, async (req, res) => {
  const { showtime_id, seats_reserved, category } = req.body;
  const user_id = req.user.user_id;

  if (!showtime_id || !seats_reserved || !Array.isArray(seats_reserved) || seats_reserved.length === 0) {
    return res.status(400).json({ message: 'Πρέπει να επιλέξετε τουλάχιστον μία θέση.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Κλείδωμα showtime για concurrent booking protection
    const [showtimes] = await connection.query(
      'SELECT * FROM showtimes WHERE showtime_id = ? FOR UPDATE',
      [showtime_id]
    );

    if (showtimes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Το showtime δεν βρέθηκε.' });
    }

    const showtime = showtimes[0];
    const numSeats = seats_reserved.length;

    if (showtime.available_seats < numSeats) {
      await connection.rollback();
      return res.status(409).json({
        message: `Δεν υπάρχουν αρκετές διαθέσιμες θέσεις. Διαθέσιμες: ${showtime.available_seats}`,
      });
    }

    // Έλεγχος ότι οι επιλεγμένες θέσεις είναι διαθέσιμες
    const [unavailableSeats] = await connection.query(
      `SELECT seat_number FROM seats 
       WHERE showtime_id = ? AND seat_number IN (?) AND is_available = false`,
      [showtime_id, seats_reserved]
    );

    if (unavailableSeats.length > 0) {
      await connection.rollback();
      const taken = unavailableSeats.map(s => s.seat_number).join(', ');
      return res.status(409).json({
        message: `Οι παρακάτω θέσεις έχουν ήδη κλειστεί: ${taken}`,
      });
    }

    // Υπολογισμός τιμής βάση κατηγορίας κάθε θέσης
    const [seatRows] = await connection.query(
      `SELECT seat_number, seat_category FROM seats 
       WHERE showtime_id = ? AND seat_number IN (?)`,
      [showtime_id, seats_reserved]
    );

    let total_price = 0;
    for (const seat of seatRows) {
      const price = seat.seat_category === 'vip' ? showtime.price_vip : showtime.price_standard;
      total_price += Number(price);
    }

    // Αποθήκευση κράτησης
    const [result] = await connection.query(
      'INSERT INTO reservations (user_id, showtime_id, seats_reserved, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, showtime_id, JSON.stringify(seats_reserved), total_price, 'confirmed']
    );

    // Σήμανση θέσεων ως μη διαθέσιμες
    await connection.query(
      `UPDATE seats SET is_available = false 
       WHERE showtime_id = ? AND seat_number IN (?)`,
      [showtime_id, seats_reserved]
    );

    // Ενημέρωση available_seats
    await connection.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [numSeats, showtime_id]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Η κράτηση ολοκληρώθηκε επιτυχώς!',
      reservation_id: result.insertId,
      seats_reserved,
      total_price,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα κατά την κράτηση.' });
  } finally {
    connection.release();
  }
});

// GET /reservations — Όλες οι κρατήσεις του χρήστη
router.get('/', verifyToken, async (req, res) => {
  try {
    const [reservations] = await db.query(
      `SELECT r.*, st.show_date, st.show_time, st.price_standard, st.price_vip,
              s.title AS show_title, s.duration,
              t.name AS theatre_name, t.location
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.user_id]
    );
    res.status(200).json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// GET /reservations/:id — Λεπτομέρειες κράτησης
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [reservations] = await db.query(
      `SELECT r.*, st.show_date, st.show_time,
              s.title AS show_title, s.duration, s.age_rating,
              t.name AS theatre_name, t.location
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE r.reservation_id = ? AND r.user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'Η κράτηση δεν βρέθηκε.' });
    }
    res.status(200).json(reservations[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// DELETE /reservations/:id — Ακύρωση κράτησης
router.delete('/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reservations] = await connection.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ? FOR UPDATE',
      [req.params.id, req.user.user_id]
    );

    if (reservations.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Η κράτηση δεν βρέθηκε.' });
    }

    const reservation = reservations[0];

    if (reservation.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: 'Η κράτηση έχει ήδη ακυρωθεί.' });
    }

    const [showtimes] = await connection.query(
      'SELECT show_date, show_time FROM showtimes WHERE showtime_id = ?',
      [reservation.showtime_id]
    );

    const showDatetime = new Date(`${showtimes[0].show_date}T${showtimes[0].show_time}`);
    if (showDatetime < new Date()) {
      await connection.rollback();
      return res.status(400).json({ message: 'Δεν μπορείτε να ακυρώσετε παράσταση που έχει ήδη γίνει.' });
    }

    // Ασφαλής parse του seats_reserved (mysql2 μπορεί να το έχει ήδη parse)
    const seatsReserved = typeof reservation.seats_reserved === 'string'
      ? JSON.parse(reservation.seats_reserved)
      : reservation.seats_reserved;
    const numSeats = seatsReserved.length;

    // Ακύρωση κράτησης
    await connection.query(
      'UPDATE reservations SET status = ? WHERE reservation_id = ?',
      ['cancelled', req.params.id]
    );

    // Επαναφορά θέσεων ως διαθέσιμες (αν υπάρχουν στον πίνακα)
    if (seatsReserved.length > 0) {
      await connection.query(
        `UPDATE seats SET is_available = true 
         WHERE showtime_id = ? AND seat_number IN (?)`,
        [reservation.showtime_id, seatsReserved]
      );
    }

    // Επαναφορά available_seats
    await connection.query(
      'UPDATE showtimes SET available_seats = available_seats + ? WHERE showtime_id = ?',
      [numSeats, reservation.showtime_id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Η κράτηση ακυρώθηκε επιτυχώς.' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα κατά την ακύρωση.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
