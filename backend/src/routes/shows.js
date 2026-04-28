const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /shows — Λίστα παραστάσεων με φίλτρα
router.get('/', async (req, res) => {
  try {
    const { theatreId, title, date } = req.query;
    let query = `
      SELECT s.*, t.name AS theatre_name, t.location AS theatre_location
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE 1=1
    `;
    const params = [];

    if (theatreId) {
      query += ' AND s.theatre_id = ?';
      params.push(theatreId);
    }
    if (title) {
      query += ' AND s.title LIKE ?';
      params.push(`%${title}%`);
    }
    if (date) {
      query += ' AND EXISTS (SELECT 1 FROM showtimes st WHERE st.show_id = s.show_id AND st.show_date = ?)';
      params.push(date);
    }

    query += ' ORDER BY s.title ASC';
    const [shows] = await db.query(query, params);
    res.status(200).json(shows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// GET /shows/:id — Λεπτομέρειες παράστασης
router.get('/:id', async (req, res) => {
  try {
    const [shows] = await db.query(
      `SELECT s.*, t.name AS theatre_name, t.location AS theatre_location
       FROM shows s
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE s.show_id = ?`,
      [req.params.id]
    );
    if (shows.length === 0) {
      return res.status(404).json({ message: 'Η παράσταση δεν βρέθηκε.' });
    }
    res.status(200).json(shows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
