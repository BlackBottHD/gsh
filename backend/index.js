require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const paketeRoute = require('./routes/pakete');
const authRoutes = require('./routes/auth')
const serverRoutes = require('./routes/server')
const eggAdminRoutes = require('./routes/admin/eggs')
const gameAdminRoutes = require('./routes/admin/games')
const paketeAdminRoutes = require('./routes/admin/pakete')
const statsAdminRoutes = require('./routes/admin/stats')
const userAdminRoutes = require('./routes/admin/users')
const rollenAdminRoutes = require('./routes/admin/rollen')
const permsRollenAdminRoutes = require('./routes/admin/perms_rollen')


app.use('/api/pakete', paketeRoute);
app.use('/api/auth', authRoutes);
app.use('/api/server', serverRoutes)
app.use('/api/admin/eggs', eggAdminRoutes)
app.use('/api/admin/games', gameAdminRoutes)
app.use('/api/admin/pakete', paketeAdminRoutes);
app.use('/api/admin/stats', statsAdminRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/admin/rollen', rollenAdminRoutes);
app.use('/api/admin/rollen/perms', permsRollenAdminRoutes);


// Beispielroute
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(3001, () => console.log('Backend läuft auf Port 3001'));
