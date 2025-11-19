import CityWeather from '../models/CityWeather.js';
import GridWeather from '../models/GridWeather.js';
import PortWeather from '../models/PortWeather.js';
import { CityMetadata, GridMetadata, PortMetadata } from '../models/Metadata.js';
import { CityWeatherHistory, GridWeatherHistory, PortWeatherHistory } from '../models/WeatherHistory.js';
import { isDataFresh } from './helpers.js';
import config from '../config/config.js';

/**
 * Weather Repository - MongoDB operations for weather data
 * Includes automatic archival of old data to history collections
 */

// ===================== METADATA OPERATIONS =====================

/**
 * Save city metadata
 * @param {Array} data - Array of city metadata objects
 */
export async function saveCityMetadata(data) {
  if (!data || data.length === 0) return;

  const operations = data.map(record => ({
    updateOne: {
      filter: { name: record.name },
      update: {
        $set: {
          ...record,
          updated_at: new Date()
        }
      },
      upsert: true
    }
  }));

  await CityMetadata.bulkWrite(operations);
}

/**
 * Save grid metadata
 * @param {Array} data - Array of grid metadata objects
 */
export async function saveGridMetadata(data) {
  if (!data || data.length === 0) return;

  // Clear existing and insert new
  await GridMetadata.deleteMany({});
  
  const documents = data.map(point => ({
    ...point,
    name: point.name || `${point.lat.toFixed(1)}, ${point.lon.toFixed(1)}`,
    updated_at: new Date()
  }));

  await GridMetadata.insertMany(documents);
}

/**
 * Save port metadata
 * @param {Array} data - Array of port metadata objects
 */
export async function savePortMetadata(data) {
  if (!data || data.length === 0) return;

  const operations = data.map(port => ({
    updateOne: {
      filter: { slug: port.slug },
      update: {
        $set: {
          ...port,
          updated_at: new Date()
        }
      },
      upsert: true
    }
  }));

  await PortMetadata.bulkWrite(operations);
}

/**
 * Get city metadata
 * @returns {Promise<Array>} Array of city metadata
 */
export async function getCityMetadata() {
  return await CityMetadata.find({}).select('-_id').lean();
}

/**
 * Get grid metadata
 * @returns {Promise<Array>} Array of grid metadata
 */
export async function getGridMetadata() {
  return await GridMetadata.find({}).select('-_id').lean();
}

/**
 * Get port metadata
 * @returns {Promise<Array>} Array of port metadata
 */
export async function getPortMetadata() {
  return await PortMetadata.find({}).select('-_id').lean();
}

// ===================== WEATHER DATA OPERATIONS =====================

/**
 * Save city weather data
 * Automatically archives old data before saving new data
 * @param {Array} data - Array of city weather objects
 */
export async function saveCityWeatherData(data) {
  if (!data || data.length === 0) return;

  // Archive existing data before updating
  const cityNames = data.map(city => city.name);
  const archivedCount = await archiveCityWeather(cityNames);
  if (archivedCount > 0) {
    console.log(`📦 Archived ${archivedCount} old city weather records to history`);
  }

  const operations = data.map(city => ({
    updateOne: {
      filter: { name: city.name },
      update: {
        $set: {
          ...city,
          updated_at: new Date()
        }
      },
      upsert: true
    }
  }));

  await CityWeather.bulkWrite(operations);
  console.log(`✅ Saved ${data.length} city weather records`);
}

/**
 * Save grid weather data
 * Automatically archives old data before saving new data
 * @param {Array} data - Array of grid weather objects
 */
export async function saveGridWeatherData(data) {
  if (!data || data.length === 0) return;

  // Archive existing data before replacing
  const gridPoints = data.map(point => ({ lat: point.lat, lon: point.lon }));
  const archivedCount = await archiveGridWeather(gridPoints);
  if (archivedCount > 0) {
    console.log(`📦 Archived ${archivedCount} old grid weather records to history`);
  }

  // Replace all grid data (snapshot approach)
  await GridWeather.deleteMany({});
  
  const documents = data.map(point => ({
    ...point,
    updated_at: new Date()
  }));

  await GridWeather.insertMany(documents);
  console.log(`✅ Saved ${data.length} grid weather records`);
}

/**
 * Save port weather data
 * Automatically archives old data before saving new data
 * @param {Array} data - Array of port weather objects
 */
export async function savePortWeatherData(data) {
  if (!data || data.length === 0) return;

  // Archive existing data before updating
  const portSlugs = data.map(port => port.slug);
  const archivedCount = await archivePortWeather(portSlugs);
  if (archivedCount > 0) {
    console.log(`📦 Archived ${archivedCount} old port weather records to history`);
  }

  const operations = data.map(port => ({
    updateOne: {
      filter: { slug: port.slug },
      update: {
        $set: {
          ...port,
          updated_at: new Date()
        }
      },
      upsert: true
    }
  }));

  await PortWeather.bulkWrite(operations);
  console.log(`✅ Saved ${data.length} port weather records`);
}

/**
 * Get city weather documents
 * @returns {Promise<Array>} Array of city weather data
 */
export async function getCityWeatherDocuments() {
  return await CityWeather.find({}).select('-_id').lean();
}

/**
 * Get grid weather documents
 * @returns {Promise<Array>} Array of grid weather data
 */
export async function getGridWeatherDocuments() {
  return await GridWeather.find({}).select('-_id').lean();
}

/**
 * Get port weather documents
 * @returns {Promise<Array>} Array of port weather data
 */
export async function getPortWeatherDocuments() {
  return await PortWeather.find({}).select('-_id').lean();
}

// ===================== FRESHNESS CHECKS =====================

/**
 * Get latest city fetch time
 * @returns {Promise<Date|null>} Latest fetch time or null
 */
export async function getLatestCityFetchTime() {
  const doc = await CityWeather
    .findOne({ 'weather_data.fetched_at': { $exists: true } })
    .sort({ 'weather_data.fetched_at': -1 })
    .select('weather_data.fetched_at')
    .lean();

  return doc?.weather_data?.fetched_at || null;
}

/**
 * Get latest grid fetch time
 * @returns {Promise<Date|null>} Latest fetch time or null
 */
export async function getLatestGridFetchTime() {
  const doc = await GridWeather
    .findOne({ 'weather_data.fetched_at': { $exists: true } })
    .sort({ 'weather_data.fetched_at': -1 })
    .select('weather_data.fetched_at')
    .lean();

  return doc?.weather_data?.fetched_at || null;
}

/**
 * Get latest port fetch time
 * @returns {Promise<Date|null>} Latest fetch time or null
 */
export async function getLatestPortTime() {
  const doc = await PortWeather
    .findOne({ fetched_at: { $exists: true } })
    .sort({ fetched_at: -1 })
    .select('fetched_at')
    .lean();

  return doc?.fetched_at || null;
}

/**
 * Check if city weather data is fresh
 * @param {number} maxAgeHours - Maximum age in hours (default from config)
 * @returns {Promise<boolean>} True if data is fresh
 */
export async function isCityWeatherFresh(maxAgeHours = config.freshness.city) {
  const latest = await getLatestCityFetchTime();
  return isDataFresh(latest, maxAgeHours);
}

/**
 * Check if grid weather data is fresh
 * @param {number} maxAgeHours - Maximum age in hours (default from config)
 * @returns {Promise<boolean>} True if data is fresh
 */
export async function isGridWeatherFresh(maxAgeHours = config.freshness.grid) {
  const latest = await getLatestGridFetchTime();
  return isDataFresh(latest, maxAgeHours);
}

/**
 * Check if port weather data is fresh
 * @param {number} maxAgeHours - Maximum age in hours (default from config)
 * @returns {Promise<boolean>} True if data is fresh
 */
export async function isPortWeatherFresh(maxAgeHours = config.freshness.port) {
  const latest = await getLatestPortTime();
  return isDataFresh(latest, maxAgeHours);
}

export default {
  // Metadata
  saveCityMetadata,
  saveGridMetadata,
  savePortMetadata,
  getCityMetadata,
  getGridMetadata,
  getPortMetadata,
  
  // Weather Data
  saveCityWeatherData,
  saveGridWeatherData,
  savePortWeatherData,
  getCityWeatherDocuments,
  getGridWeatherDocuments,
  getPortWeatherDocuments,
  
  // Freshness
  getLatestCityFetchTime,
  getLatestGridFetchTime,
  getLatestPortTime,
  isCityWeatherFresh,
  isGridWeatherFresh,
  isPortWeatherFresh,
  
  // Historical Data
  archiveCityWeather,
  archiveGridWeather,
  archivePortWeather,
  getCityWeatherHistory,
  getGridWeatherHistory,
  getPortWeatherHistory,
  cleanupOldHistory
};

// ===================== HISTORICAL DATA OPERATIONS =====================

/**
 * Archive current city weather data to history before updating
 * @param {Array|Object} cityNames - City name(s) to archive
 */
export async function archiveCityWeather(cityNames) {
  const names = Array.isArray(cityNames) ? cityNames : [cityNames];
  
  const currentData = await CityWeather.find({ name: { $in: names } }).lean();
  
  if (currentData.length === 0) return 0;
  
  const historyDocs = currentData.map(doc => ({
    ...doc,
    _id: undefined, // Remove original _id
    archived_at: new Date(),
    original_updated_at: doc.updated_at
  }));
  
  await CityWeatherHistory.insertMany(historyDocs);
  return historyDocs.length;
}

/**
 * Archive current grid weather data to history before updating
 * @param {Array} gridPoints - Array of {lat, lon} to archive
 */
export async function archiveGridWeather(gridPoints) {
  if (!gridPoints || gridPoints.length === 0) return 0;
  
  const currentData = await GridWeather.find({
    $or: gridPoints.map(point => ({ lat: point.lat, lon: point.lon }))
  }).lean();
  
  if (currentData.length === 0) return 0;
  
  const historyDocs = currentData.map(doc => ({
    ...doc,
    _id: undefined, // Remove original _id
    archived_at: new Date(),
    original_updated_at: doc.updated_at
  }));
  
  await GridWeatherHistory.insertMany(historyDocs);
  return historyDocs.length;
}

/**
 * Archive current port weather data to history before updating
 * @param {Array|Object} portSlugs - Port slug(s) to archive
 */
export async function archivePortWeather(portSlugs) {
  const slugs = Array.isArray(portSlugs) ? portSlugs : [portSlugs];
  
  const currentData = await PortWeather.find({ slug: { $in: slugs } }).lean();
  
  if (currentData.length === 0) return 0;
  
  const historyDocs = currentData.map(doc => ({
    ...doc,
    _id: undefined, // Remove original _id
    archived_at: new Date(),
    original_updated_at: doc.updated_at
  }));
  
  await PortWeatherHistory.insertMany(historyDocs);
  return historyDocs.length;
}

/**
 * Get city weather history
 * @param {String} cityName - City name
 * @param {Object} options - Query options
 * @returns {Array} Historical weather data
 */
export async function getCityWeatherHistory(cityName, options = {}) {
  const {
    startDate = null,
    endDate = null,
    limit = 100,
    sort = { archived_at: -1 }
  } = options;
  
  const query = { name: cityName };
  
  if (startDate || endDate) {
    query.archived_at = {};
    if (startDate) query.archived_at.$gte = new Date(startDate);
    if (endDate) query.archived_at.$lte = new Date(endDate);
  }
  
  return await CityWeatherHistory.find(query)
    .sort(sort)
    .limit(limit)
    .lean();
}

/**
 * Get grid weather history
 * @param {Number} lat - Latitude
 * @param {Number} lon - Longitude
 * @param {Object} options - Query options
 * @returns {Array} Historical weather data
 */
export async function getGridWeatherHistory(lat, lon, options = {}) {
  const {
    startDate = null,
    endDate = null,
    limit = 100,
    sort = { archived_at: -1 }
  } = options;
  
  const query = { lat, lon };
  
  if (startDate || endDate) {
    query.archived_at = {};
    if (startDate) query.archived_at.$gte = new Date(startDate);
    if (endDate) query.archived_at.$lte = new Date(endDate);
  }
  
  return await GridWeatherHistory.find(query)
    .sort(sort)
    .limit(limit)
    .lean();
}

/**
 * Get port weather history
 * @param {String} portSlug - Port slug
 * @param {Object} options - Query options
 * @returns {Array} Historical weather data
 */
export async function getPortWeatherHistory(portSlug, options = {}) {
  const {
    startDate = null,
    endDate = null,
    limit = 100,
    sort = { archived_at: -1 }
  } = options;
  
  const query = { slug: portSlug };
  
  if (startDate || endDate) {
    query.archived_at = {};
    if (startDate) query.archived_at.$gte = new Date(startDate);
    if (endDate) query.archived_at.$lte = new Date(endDate);
  }
  
  return await PortWeatherHistory.find(query)
    .sort(sort)
    .limit(limit)
    .lean();
}

/**
 * Clean up old historical data
 * @param {Number} daysToKeep - Number of days of history to keep (default: 90)
 * @returns {Object} Deletion counts
 */
export async function cleanupOldHistory(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const [cityResult, gridResult, portResult] = await Promise.all([
    CityWeatherHistory.deleteMany({ archived_at: { $lt: cutoffDate } }),
    GridWeatherHistory.deleteMany({ archived_at: { $lt: cutoffDate } }),
    PortWeatherHistory.deleteMany({ archived_at: { $lt: cutoffDate } })
  ]);
  
  return {
    city: cityResult.deletedCount,
    grid: gridResult.deletedCount,
    port: portResult.deletedCount,
    total: cityResult.deletedCount + gridResult.deletedCount + portResult.deletedCount
  };
}
