const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  avatarUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
