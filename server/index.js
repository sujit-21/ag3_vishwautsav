const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
// Environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/festivals', require('./routes/festivals'));
app.use('/api/events', require('./routes/events'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/support', require('./routes/support'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/credentials', require('./routes/credentials'));
app.use('/api/entity', require('./routes/entity'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/activity-logs', require('./routes/activityLogs'));

// Public endpoint for Home Tab: Combines all active live festivals & events across all entities
app.get('/api/public/live-celebrations', async (req, res) => {
    try {
        const Festival = require('./models/Festival');
        const Event = require('./models/Event');

        const [festivals, events] = await Promise.all([
            Festival.find({ isLive: true })
                .select('title description location startDate endDate category country entityName image isLive createdAt')
                .lean(),
            Event.find({ isLive: true })
                .select('title description date startTime endTime location price currency category country entityName image isLive createdAt')
                .lean()
        ]);

        const formatted = [
            ...festivals.map(f => ({
                ...f,
                type: 'festival',
                dateStart: f.startDate,
                dateEnd: f.endDate
            })),
            ...events.map(e => ({
                ...e,
                type: 'event',
                dateStart: e.date,
                dateEnd: e.date
            }))
        ].sort((a, b) => new Date(a.dateStart || 0) - new Date(b.dateStart || 0));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching live celebrations:', err);
        res.status(500).json({ message: 'Failed to fetch live celebrations' });
    }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Festival & Event Management API is running...');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishwautsav_db';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    // ── Auto-migrate: backfill baseRole for all existing users ──
    const User = require('./models/User');
    const usersWithoutBaseRole = await User.find({ baseRole: { $exists: false } });
    if (usersWithoutBaseRole.length > 0) {
        let migrated = 0;
        for (const u of usersWithoutBaseRole) {
            const baseRole = u.createdBy ? 'user' : (u.role || 'user');
            await User.findByIdAndUpdate(u._id, { baseRole });
            migrated++;
        }
        console.log(`[Migration] Backfilled baseRole for ${migrated} existing users.`);
    }

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try changing the port in your .env file.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
