import axios from 'axios';
import { connectDatabase } from '../utils/database.js';
import {
  getCityMetadata,
  saveCityMetadata,
  saveCityWeatherData,
  isCityWeatherFresh
} from '../utils/weatherRepository.js';
import { sleep, logWithTimestamp } from '../utils/helpers.js';
import config from '../config/config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * City Weather Collector
 * Fetches weather data for Indonesian cities using OpenMeteo API
 */

/**
 * Load city coordinates from MongoDB or fallback JSON file
 */
async function loadCityCoordinates() {
  try {
    const metadata = await getCityMetadata();
    
    if (metadata && metadata.length > 0) {
      const cities = metadata
        .filter(doc => doc.latitude != null && doc.longitude != null)
        .map(doc => ({
          name: doc.name,
          lat: doc.latitude,
          lon: doc.longitude
        }));
      
      logWithTimestamp(`Loaded ${cities.length} cities from MongoDB city_metadata collection`, 'info');
      return cities;
    }
  } catch (error) {
    logWithTimestamp(`Error loading city metadata from MongoDB: ${error.message}`, 'warn');
  }

  // Fallback to default city list
  const defaultCities = [
    { name: 'Banda Aceh', lat: 5.5483, lon: 95.3238 },
    { name: 'Medan', lat: 3.5952, lon: 98.6722 },
    { name: 'Palembang', lat: -2.9761, lon: 104.7754 },
    { name: 'Padang', lat: -0.9471, lon: 100.4172 },
    { name: 'Bengkulu', lat: -3.8004, lon: 102.2655 },
    { name: 'Pekanbaru', lat: 0.5071, lon: 101.4478 },
    { name: 'Tanjung Pinang', lat: 0.9186, lon: 104.4586 },
    { name: 'Jambi', lat: -1.6101, lon: 103.6131 },
    { name: 'Bandar Lampung', lat: -5.4292, lon: 105.2619 },
    { name: 'Pangkal Pinang', lat: -2.1316, lon: 106.1169 },
    { name: 'Pontianak', lat: -0.0263, lon: 109.3425 },
    { name: 'Samarinda', lat: -0.5022, lon: 117.1536 },
    { name: 'Banjarbaru', lat: -3.4543, lon: 114.8405 },
    { name: 'Palangkaraya', lat: -2.2089, lon: 113.9213 },
    { name: 'Tanjung Selor', lat: 2.8362, lon: 117.3625 },
    { name: 'Serang', lat: -6.1204, lon: 106.1503 },
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
    { name: 'Bandung', lat: -6.9175, lon: 107.6191 },
    { name: 'Semarang', lat: -6.9667, lon: 110.4167 },
    { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695 },
    { name: 'Surabaya', lat: -7.2575, lon: 112.7521 },
    { name: 'Denpasar', lat: -8.6705, lon: 115.2126 },
    { name: 'Kupang', lat: -10.1718, lon: 123.6075 },
    { name: 'Mataram', lat: -8.5833, lon: 116.1167 },
    { name: 'Gorontalo', lat: 0.5435, lon: 123.0585 },
    { name: 'Mamuju', lat: -2.6739, lon: 118.8896 },
    { name: 'Palu', lat: -0.8999, lon: 119.8707 },
    { name: 'Manado', lat: 1.4748, lon: 124.8421 },
    { name: 'Kendari', lat: -3.9450, lon: 122.5986 },
    { name: 'Makassar', lat: -5.1477, lon: 119.4327 },
    { name: 'Sofifi', lat: 0.7436, lon: 127.5664 },
    { name: 'Ambon', lat: -3.6954, lon: 128.1814 },
    { name: 'Manokwari', lat: -0.8618, lon: 134.0640 },
    { name: 'Jayapura', lat: -2.5920, lon: 140.6692 }
  ];

  // Save to MongoDB for future use
  try {
    const metadataToSave = defaultCities.map(city => ({
      name: city.name,
      latitude: city.lat,
      longitude: city.lon,
      country: 'Indonesia'
    }));
    await saveCityMetadata(metadataToSave);
    logWithTimestamp('Seeded city metadata to MongoDB', 'info');
  } catch (error) {
    logWithTimestamp(`Failed to seed city metadata: ${error.message}`, 'warn');
  }

  logWithTimestamp(`Using ${defaultCities.length} default cities`, 'info');
  return defaultCities;
}

/**
 * Fetch weather data for cities using OpenMeteo API
 */
async function fetchCityWeatherData(cities) {
  if (!cities || cities.length === 0) {
    return [];
  }

  const lats = cities.map(city => city.lat);
  const lons = cities.map(city => city.lon);

  const params = {
    latitude: lats,
    longitude: lons,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m'
    ],
    timezone: 'Asia/Jakarta'
  };

  try {
    logWithTimestamp(`Fetching weather data for ${cities.length} cities...`, 'info');
    
    const response = await axios.get(config.api.openMeteoUrl, { params });
    const processedData = [];

    // OpenMeteo returns an array of responses, one per location
    if (response.data && Array.isArray(response.data)) {
      for (let i = 0; i < response.data.length && i < cities.length; i++) {
        const locationData = response.data[i];
        const city = cities[i];
        
        if (locationData.current) {
          const current = locationData.current;
          
          processedData.push({
            name: city.name,
            lat: city.lat,
            lon: city.lon,
            coordinates: {
              latitude: locationData.latitude || city.lat,
              longitude: locationData.longitude || city.lon,
              elevation: locationData.elevation || 0
            },
            weather_data: {
              temperature_2m: current.temperature_2m,
              relative_humidity_2m: current.relative_humidity_2m,
              weather_code: current.weather_code,
              wind_speed_10m: current.wind_speed_10m,
              wind_direction_10m: current.wind_direction_10m,
              timestamp: current.time,
              timezone: locationData.timezone,
              utc_offset_seconds: locationData.utc_offset_seconds,
              fetched_at: new Date()
            }
          });
        }
      }
    }

    logWithTimestamp(`Successfully processed ${processedData.length} cities`, 'info');
    return processedData;

  } catch (error) {
    logWithTimestamp(`Error fetching city weather data: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Check if city weather data needs updating
 */
async function checkDataFreshness() {
  try {
    const fresh = await isCityWeatherFresh();
    if (fresh) {
      logWithTimestamp('City weather data is still fresh (<= 6 hours old)', 'info');
    } else {
      logWithTimestamp('City weather data is stale or missing. Update required.', 'info');
    }
    return fresh;
  } catch (error) {
    logWithTimestamp(`Error checking data freshness: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  logWithTimestamp('Starting city weather data update', 'info');
  logWithTimestamp('='.repeat(60), 'info');

  try {
    // Connect to database
    await connectDatabase();

    // Check if update is needed
    if (await checkDataFreshness()) {
      logWithTimestamp('City weather data is still fresh. No update needed.', 'info');
      return 0;
    }

    // Load city coordinates
    logWithTimestamp('Loading city coordinates...', 'info');
    const cities = await loadCityCoordinates();

    if (!cities || cities.length === 0) {
      logWithTimestamp('No cities loaded. Cannot proceed with update.', 'error');
      return 1;
    }

    // Fetch city weather data
    logWithTimestamp(`Fetching weather data for ${cities.length} cities...`, 'info');
    const cityWeatherData = await fetchCityWeatherData(cities);

    if (cityWeatherData && cityWeatherData.length > 0) {
      // Save the updated data to MongoDB
      await saveCityWeatherData(cityWeatherData);
      logWithTimestamp('City weather data update completed successfully!', 'info');
      logWithTimestamp(`Updated ${cityWeatherData.length} cities`, 'info');
      return 0;
    } else {
      logWithTimestamp('Failed to fetch city weather data', 'error');
      return 1;
    }

  } catch (error) {
    logWithTimestamp(`Error during city weather data update: ${error.message}`, 'error');
    console.error(error);
    return 1;
  }
}

// Run if called directly
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('cityWeatherCollector.js')
);

if (isMainModule) {
  main()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main;
