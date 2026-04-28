const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /theatres — Λίστα όλων των θεάτρων
router.get('/', async (req, res) => {
  try {
    const { location, name } = req.query;
    let query = 'SELECT * FROM theatres WHERE 1=1';
    const params = [];

    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    query += ' ORDER BY name ASC';
    const [theatres] = await db.query(query, params);
    res.status(200).json(theatres);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// GET /theatres/:id — Λεπτομέρειες θεάτρου
router.get('/:id', async (req, res) => {
  try {
    const [theatres] = await db.query('SELECT * FROM theatres WHERE theatre_id = ?', [req.params.id]);
    if (theatres.length === 0) {
      return res.status(404).json({ message: 'Το θέατρο δεν βρέθηκε.' });
    }
    res.status(200).json(theatres[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
