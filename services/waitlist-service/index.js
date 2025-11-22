require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { validateWaitlist, validateNotify } = require('./validators/waitlist.validator');
const {
  addToWaitlist,
  removeFromWaitlist,
  getClientWaitlist,
  notifyAvailability
} = require('./controllers/waitlist.controller');

const app = express();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Waitlist Service connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.json({ 
    service: 'waitlist-service', 
    status: 'healthy' 
  });
});

app.post('/waitlist', validateWaitlist, addToWaitlist);
app.delete('/waitlist/:id', removeFromWaitlist);
app.get('/waitlist/client/:clientId', getClientWaitlist);
app.post('/notify-availability', validateNotify, notifyAvailability);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Waitlist Service running on port ${PORT}`);
});
