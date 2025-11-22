require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { validateAuditLog } = require('./validators/audit.validator');
const {
  createLog,
  getLogs,
  getLogById,
  getActionTypes
} = require('./controllers/audit.controller');

// Register models for population
require('./models/Client');

const app = express();
const PORT = process.env.PORT || 4004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon';

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Audit Service connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.json({ 
    service: 'audit-service', 
    status: 'healthy' 
  });
});

app.post('/log', validateAuditLog, createLog);
app.get('/logs', getLogs);
app.get('/logs/:id', getLogById);
app.get('/actions', getActionTypes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Audit Service running on port ${PORT}`);
});
