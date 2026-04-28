const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/theatres', require('./routes/theatres'));
app.use('/shows', require('./routes/shows'));
app.use('/showtimes', require('./routes/showtimes'));
app.use('/seats', require('./routes/seats'));
app.use('/reservations', require('./routes/reservations'));
app.use('/user', require('./routes/users'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🎭 Theatre Booking API is running!', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎭 Theatre Booking Server running on http://localhost:${PORT}`);
});
