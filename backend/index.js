require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const paketeRoute = require('./routes/pakete');
const authRoutes = require('./routes/auth')

app.use('/api/pakete', paketeRoute);
app.use('/api/auth', authRoutes);

// Beispielroute
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(3001, () => console.log('Backend läuft auf Port 3001'));
