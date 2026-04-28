const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// POST /register — Εγγραφή νέου χρήστη
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Όλα τα πεδία είναι υποχρεωτικά.' });
  }

  try {
    // Έλεγχος αν υπάρχει ήδη το email
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Το email χρησιμοποιείται ήδη.' });
    }

    // Hash του password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Εισαγωγή χρήστη
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Δημιουργία JWT token
    const token = jwt.sign(
      { user_id: result.insertId, email, name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Εγγραφή επιτυχής!',
      token,
      user: { user_id: result.insertId, name, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

// POST /login — Σύνδεση χρήστη
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email και password είναι υποχρεωτικά.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Λάθος email ή password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Λάθος email ή password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Σύνδεση επιτυχής!',
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});

module.exports = router;
