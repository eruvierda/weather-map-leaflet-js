import mongoose from 'mongoose';

const gridWeatherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true,
    index: true
  },
  lon: {
    type: Number,
    required: true,
    index: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
    elevation: Number
  },
  weather_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: process.env.GRID_COLLECTION || 'grid_weather',
  timestamps: false
});

// Compound index for efficient spatial queries
gridWeatherSchema.index({ lat: 1, lon: 1, 'weather_data.fetched_at': -1 });

export default mongoose.model('GridWeather', gridWeatherSchema);
