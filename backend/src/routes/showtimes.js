const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /showtimes?showId=1 — Showtimes για συγκεκριμένη παράσταση
router.get('/', async (req, res) => {
  try {
    const { showId } = req.query;
    let query = `
      SELECT st.*, s.title AS show_title, t.name AS theatre_name
      FROM showtimes st
      JOIN shows s ON st.show_id = s.show_id
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE st.show_date >= CURDATE()
    `;
    const params = [];

    if (showId) {
      query += ' AND st.show_id = ?';
      params.push(showId);
    }

    query += ' ORDER BY st.show_date ASC, st.show_time ASC';
    const [showtimes] = await db.query(query, params);
    res.status(200).json(showtimes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// GET /showtimes/:id — Λεπτομέρειες showtime
router.get('/:id', async (req, res) => {
  try {
    const [showtimes] = await db.query(
      `SELECT st.*, s.title AS show_title, s.description AS show_description,
              s.duration, s.age_rating, t.name AS theatre_name, t.location
       FROM showtimes st
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE st.showtime_id = ?`,
      [req.params.id]
    );
    if (showtimes.length === 0) {
      return res.status(404).json({ message: 'Το showtime δεν βρέθηκε.' });
    }
    res.status(200).json(showtimes[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
