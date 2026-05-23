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
app.use('/api/about', require('./routes/about'));
app.use('/api/support', require('./routes/support'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/credentials', require('./routes/credentials'));
app.use('/api/entity', require('./routes/entity'));

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
    // Users who registered before the baseRole field was added need to be updated.
    // Safe to run every startup — only affects users where baseRole is not yet set.
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
