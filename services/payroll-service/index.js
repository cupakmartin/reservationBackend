require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { validateCommissionRate, validatePayout } = require('./validators/payroll.validator');
const {
  setCommissionRate,
  getWorkerReport,
  getAllWorkersReport,
  createPayout,
  updatePayoutStatus
} = require('./controllers/payroll.controller');

// Register models
require('./models/Client');
require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 4003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Payroll Service connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.json({ 
    service: 'payroll-service', 
    status: 'healthy' 
  });
});

app.put('/rates/:workerId', validateCommissionRate, setCommissionRate);
app.get('/report/:workerId', getWorkerReport);
app.get('/reports/all', getAllWorkersReport);
app.post('/payouts', validatePayout, createPayout);
app.patch('/payouts/:id/status', updatePayoutStatus);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Payroll Service running on port ${PORT}`);
});
