const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Αυτόματη δημιουργία θέσεων για ένα showtime αν δεν υπάρχουν
async function generateSeatsIfNeeded(showtimeId) {
  const [existing] = await db.query(
    'SELECT COUNT(*) as count FROM seats WHERE showtime_id = ?',
    [showtimeId]
  );
  if (existing[0].count > 0) return;

  // Γεννάμε θέσεις: Σειρές A-J, 10 θέσεις η κάθε μία = 100 θέσεις
  // Σειρές A,B,C = VIP | D-J = Standard
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = 10;
  const insertValues = [];

  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatNumber = `${row}${i}`;
      const category = ['A', 'B', 'C'].includes(row) ? 'vip' : 'standard';
      insertValues.push([showtimeId, seatNumber, category, true]);
    }
  }

  await db.query(
    'INSERT INTO seats (showtime_id, seat_number, seat_category, is_available) VALUES ?',
    [insertValues]
  );
}

// GET /seats?showtimeId=1 — Διαθεσιμότητα θέσεων
router.get('/', async (req, res) => {
  try {
    const { showtimeId } = req.query;
    if (!showtimeId) {
      return res.status(400).json({ message: 'Το showtimeId είναι υποχρεωτικό.' });
    }

    const [showtimeInfo] = await db.query(
      'SELECT available_seats, total_seats, price_standard, price_vip FROM showtimes WHERE showtime_id = ?',
      [showtimeId]
    );

    if (showtimeInfo.length === 0) {
      return res.status(404).json({ message: 'Το showtime δεν βρέθηκε.' });
    }

    // Auto-generate αν δεν υπάρχουν θέσεις
    await generateSeatsIfNeeded(showtimeId);

    const [seats] = await db.query(
      'SELECT * FROM seats WHERE showtime_id = ? ORDER BY LEFT(seat_number, 1) ASC, CAST(SUBSTRING(seat_number, 2) AS UNSIGNED) ASC',
      [showtimeId]
    );

    res.status(200).json({
      showtime: showtimeInfo[0],
      seats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
