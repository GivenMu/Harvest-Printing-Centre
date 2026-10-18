// Builds the Express app. server.js starts it; tests import it directly.
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check (also used to wake the free Render server before the demo).
app.get('/', (req, res) => res.status(200).json({ status: 'ok', service: 'Harvest Printing API' }));

app.use('/services', require('./routes/services'));
app.use('/bookings', require('./routes/bookings'));
app.use('/orders', require('./routes/orders'));

// 404 for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Bad JSON gets 400; anything else is a 500 without leaking details.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
