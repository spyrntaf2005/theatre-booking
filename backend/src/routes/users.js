const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET /user/profile — Προφίλ χρήστη
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, name, email, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Ο χρήστης δεν βρέθηκε.' });
    }
    res.status(200).json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// DELETE /user/reservations/:id — Οριστική διαγραφή ακυρωμένης κράτησης
router.delete('/reservations/:id', verifyToken, async (req, res) => {
  try {
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'Η κράτηση δεν βρέθηκε.' });
    }

    if (reservations[0].status !== 'cancelled') {
      return res.status(400).json({ message: 'Μπορείτε να διαγράψετε μόνο ακυρωμένες κρατήσεις.' });
    }

    await db.query('DELETE FROM reservations WHERE reservation_id = ?', [req.params.id]);
    res.status(200).json({ message: 'Η κράτηση διαγράφηκε οριστικά.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// GET /user/reservations — Κρατήσεις χρήστη
router.get('/reservations', verifyToken, async (req, res) => {
  try {
    const [reservations] = await db.query(
      `SELECT r.*, st.show_date, st.show_time,
              s.title AS show_title, s.duration, s.image_url,
              t.name AS theatre_name, t.location
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE r.user_id = ?
       ORDER BY st.show_date DESC`,
      [req.user.user_id]
    );
    res.status(200).json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
