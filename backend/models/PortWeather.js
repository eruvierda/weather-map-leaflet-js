import mongoose from 'mongoose';

const portWeatherSchema = new mongoose.Schema({
  port_name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  coordinates: {
    lat: Number,
    lon: Number
  },
  weather_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  fetched_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'error'],
    default: 'success'
  },
  error: String,
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: process.env.PORT_COLLECTION || 'port_weather',
  timestamps: false
});

// Index for efficient queries
portWeatherSchema.index({ port_name: 1, fetched_at: -1 });

export default mongoose.model('PortWeather', portWeatherSchema);
