import mongoose from 'mongoose';

const cityWeatherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
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
  collection: process.env.CITY_COLLECTION || 'city_weather',
  timestamps: false
});

// Compound index for efficient queries
cityWeatherSchema.index({ name: 1, 'weather_data.fetched_at': -1 });

export default mongoose.model('CityWeather', cityWeatherSchema);
