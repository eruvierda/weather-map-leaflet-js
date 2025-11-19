import mongoose from 'mongoose';

/**
 * Historical Weather Data Models
 * Stores archived weather data for historical analysis
 */

// City Weather History Schema
const cityWeatherHistorySchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  lat: mongoose.Schema.Types.Mixed,
  lon: mongoose.Schema.Types.Mixed,
  coordinates: mongoose.Schema.Types.Mixed,
  weather_data: mongoose.Schema.Types.Mixed,
  archived_at: { type: Date, default: Date.now, index: true },
  original_updated_at: Date,
  updated_at: Date
}, {
  collection: 'city_weather_history',
  timestamps: false,
  strict: false
});

// Compound index for efficient queries
cityWeatherHistorySchema.index({ name: 1, archived_at: -1 });
cityWeatherHistorySchema.index({ 'weather_data.fetched_at': -1 });

// Grid Weather History Schema
const gridWeatherHistorySchema = new mongoose.Schema({
  name: String,
  lat: mongoose.Schema.Types.Mixed,
  lon: mongoose.Schema.Types.Mixed,
  coordinates: mongoose.Schema.Types.Mixed,
  weather_data: mongoose.Schema.Types.Mixed,
  archived_at: { type: Date, default: Date.now, index: true },
  original_updated_at: Date,
  updated_at: Date
}, {
  collection: 'grid_weather_history',
  timestamps: false,
  strict: false
});

// Compound indexes for efficient queries
gridWeatherHistorySchema.index({ lat: 1, lon: 1, archived_at: -1 });
gridWeatherHistorySchema.index({ 'weather_data.fetched_at': -1 });

// Port Weather History Schema
const portWeatherHistorySchema = new mongoose.Schema({
  port_name: String,
  slug: String,
  coordinates: mongoose.Schema.Types.Mixed,
  weather_data: mongoose.Schema.Types.Mixed,
  fetched_at: Date,
  status: String,
  error: String,
  archived_at: { type: Date, default: Date.now, index: true },
  original_updated_at: Date,
  updated_at: Date
}, {
  collection: 'port_weather_history',
  timestamps: false,
  strict: false
});

// Compound indexes for efficient queries
portWeatherHistorySchema.index({ port_name: 1, archived_at: -1 });
portWeatherHistorySchema.index({ slug: 1, archived_at: -1 });
portWeatherHistorySchema.index({ fetched_at: -1 });

// Create models
const CityWeatherHistory = mongoose.model('CityWeatherHistory', cityWeatherHistorySchema);
const GridWeatherHistory = mongoose.model('GridWeatherHistory', gridWeatherHistorySchema);
const PortWeatherHistory = mongoose.model('PortWeatherHistory', portWeatherHistorySchema);

export { CityWeatherHistory, GridWeatherHistory, PortWeatherHistory };
