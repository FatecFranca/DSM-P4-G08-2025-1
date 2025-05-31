const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  humidity: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  temperature: {
    type: String,
    required: true
  },
  timestamp_TTL: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
