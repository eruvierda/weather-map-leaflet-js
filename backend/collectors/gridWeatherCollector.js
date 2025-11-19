import axios from 'axios';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../utils/database.js';
import {
  getGridMetadata,
  saveGridMetadata,
  saveGridWeatherData,
  isGridWeatherFresh
} from '../utils/weatherRepository.js';
import { sleep, batchArray, logWithTimestamp } from '../utils/helpers.js';
import config from '../config/config.js';

/**
 * Grid Weather Collector
 * Fetches weather data for 1-degree grid points using OpenMeteo API
 */

/**
 * Load grid coordinates from MongoDB or generate default grid
 */
async function loadGridCoordinates() {
  try {
    const metadata = await getGridMetadata();
    
    if (metadata && metadata.length > 0) {
      const gridPoints = metadata
        .filter(doc => doc.lat != null && doc.lon != null)
        .map(doc => ({
          name: doc.name || `${doc.lat.toFixed(1)}, ${doc.lon.toFixed(1)}`,
          lat: doc.lat,
          lon: doc.lon
        }));
      
      logWithTimestamp(`Loaded ${gridPoints.length} grid points from MongoDB grid_metadata collection`, 'info');
      return gridPoints;
    }
  } catch (error) {
    logWithTimestamp(`Error loading grid metadata from MongoDB: ${error.message}`, 'warn');
  }

  // Generate default 1-degree grid for Indonesia
  logWithTimestamp('Creating default 1-degree grid data...', 'info');
  const gridPoints = [];
  const metadataDocs = [];

  // Indonesia bounding box: approximately -11° to 6° latitude, 95° to 141° longitude
  for (let lat = -11; lat <= 6; lat++) {
    for (let lon = 95; lon <= 141; lon++) {
      const name = `${lat.toFixed(1)}, ${lon.toFixed(1)}`;
      gridPoints.push({ name, lat, lon });
      metadataDocs.push({ name, lat, lon });
    }
  }

  // Save to MongoDB for future use
  try {
    await saveGridMetadata(metadataDocs);
    logWithTimestamp('Seeded grid metadata to MongoDB', 'info');
  } catch (error) {
    logWithTimestamp(`Failed to seed grid metadata: ${error.message}`, 'warn');
  }

  logWithTimestamp(`Created ${gridPoints.length} grid points`, 'info');
  return gridPoints;
}

/**
 * Fetch weather data for a batch of grid points
 */
async function fetchWeatherDataBatch(locations) {
  if (!locations || locations.length === 0) {
    return [];
  }

  const lats = locations.map(loc => loc.lat);
  const lons = locations.map(loc => loc.lon);

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
    const response = await axios.get(config.api.openMeteoUrl, { params });
    const processedData = [];

    // Process response data
    if (response.data && Array.isArray(response.data)) {
      for (let i = 0; i < response.data.length && i < locations.length; i++) {
        const locationData = response.data[i];
        const location = locations[i];
        
        if (locationData.current) {
          const current = locationData.current;
          
          processedData.push({
            name: location.name,
            lat: location.lat,
            lon: location.lon,
            coordinates: {
              latitude: locationData.latitude || location.lat,
              longitude: locationData.longitude || location.lon,
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

    return processedData;

  } catch (error) {
    logWithTimestamp(`Error fetching batch: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Fetch weather data in batches with retry logic
 */
async function fetchWeatherDataBatched(locations, batchSize = config.collector.batchSize) {
  if (!locations || locations.length === 0) {
    return [];
  }

  const batches = batchArray(locations, batchSize);
  const totalBatches = batches.length;

  logWithTimestamp(`Processing ${locations.length} locations in batches of ${batchSize}...`, 'info');
  logWithTimestamp(`Total batches: ${totalBatches}`, 'info');
  logWithTimestamp(`Estimated time: ${totalBatches * 10} seconds (with delays)`, 'info');
  logWithTimestamp('='.repeat(60), 'info');

  const allProcessedData = [];
  const startTime = Date.now();

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const batchStartTime = Date.now();
    const batchLocations = batches[batchNum];

    logWithTimestamp(`\nBatch ${batchNum + 1}/${totalBatches} (${batchLocations.length} locations)...`, 'info');

    // Retry logic for failed batches
    const maxRetries = config.collector.maxRetries;
    let retryDelay = 60000; // Start with 60 seconds delay
    let batchData = null;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        batchData = await fetchWeatherDataBatch(batchLocations);
        
        if (batchData && batchData.length > 0) {
          allProcessedData.push(...batchData);
          
          const batchTime = (Date.now() - batchStartTime) / 1000;
          const totalTime = (Date.now() - startTime) / 1000;
          const avgTimePerBatch = totalTime / (batchNum + 1);
          const remainingBatches = totalBatches - (batchNum + 1);
          const eta = remainingBatches * avgTimePerBatch;

          logWithTimestamp(
            `✅ Batch ${batchNum + 1} completed: ${batchData.length} locations processed`,
            'info'
          );
          logWithTimestamp(
            `   Batch time: ${batchTime.toFixed(1)}s | Total time: ${totalTime.toFixed(1)}s | ETA: ${eta.toFixed(1)}s`,
            'info'
          );
          break;
        } else {
          logWithTimestamp(`❌ Batch ${batchNum + 1} failed (attempt ${retry + 1}/${maxRetries})`, 'warn');
        }
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('rate limit') || errorMsg.includes('minutely')) {
          logWithTimestamp(`⏳ Rate limit hit for batch ${batchNum + 1}. Waiting ${retryDelay / 1000} seconds...`, 'warn');
          await sleep(retryDelay);
          retryDelay *= 2; // Exponential backoff
        } else {
          logWithTimestamp(`❌ Error in batch ${batchNum + 1}: ${error.message}`, 'error');
        }

        if (retry === maxRetries - 1) {
          logWithTimestamp(`❌ Batch ${batchNum + 1} failed after ${maxRetries} attempts`, 'error');
        }
      }
    }

    // Wait between batches to be respectful to the API
    if (batchNum < totalBatches - 1) {
      const waitTime = config.collector.requestDelayMs * 10; // 5 seconds default
      logWithTimestamp(`⏸️  Waiting ${waitTime / 1000} seconds before next batch...`, 'info');
      await sleep(waitTime);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  logWithTimestamp('\n' + '='.repeat(60), 'info');
  logWithTimestamp(`🎉 Completed all batches in ${totalTime.toFixed(1)} seconds!`, 'info');
  logWithTimestamp(`📊 Total locations processed: ${allProcessedData.length}/${locations.length}`, 'info');
  logWithTimestamp(`📈 Success rate: ${((allProcessedData.length / locations.length) * 100).toFixed(1)}%`, 'info');

  return allProcessedData;
}

/**
 * Check if grid weather data needs updating
 */
async function checkDataFreshness() {
  try {
    const fresh = await isGridWeatherFresh();
    if (fresh) {
      logWithTimestamp('Grid weather data is still fresh (<= 12 hours old)', 'info');
    } else {
      logWithTimestamp('Grid weather data is stale or missing. Update required.', 'info');
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
  // Force immediate console output
  process.stdout.write('Starting grid weather collector...\n');
  
  logWithTimestamp('OpenMeteo Grid Weather Data Fetcher', 'info');
  logWithTimestamp('='.repeat(60), 'info');
  logWithTimestamp('Using 1-degree grid resolution for higher detail', 'info');
  logWithTimestamp('='.repeat(60), 'info');

  try {
    // Connect to database
    logWithTimestamp('Connecting to MongoDB...', 'info');
    await connectDatabase();
    logWithTimestamp('Connected to MongoDB', 'info');

    // Check if update is needed
    logWithTimestamp('Checking data freshness...', 'info');
    if (await checkDataFreshness()) {
      logWithTimestamp('Grid weather data is still fresh. No update needed.', 'info');
      process.stdout.write('✅ Grid data is fresh. Exiting.\n');
      return 0;
    }

    // Load grid coordinates
    logWithTimestamp('\nFetching 1-degree grid weather data...', 'info');
    const gridPoints = await loadGridCoordinates();

    if (!gridPoints || gridPoints.length === 0) {
      logWithTimestamp('No grid points loaded. Cannot proceed with update.', 'error');
      return 1;
    }

    // Fetch grid weather data in batches
    const gridWeatherData = await fetchWeatherDataBatched(gridPoints);

    if (gridWeatherData && gridWeatherData.length > 0) {
      await saveGridWeatherData(gridWeatherData);
      logWithTimestamp(`\nSaved ${gridWeatherData.length} grid points to MongoDB grid_weather collection`, 'info');
      logWithTimestamp('\nGrid weather data collection complete!', 'info');
      return 0;
    } else {
      logWithTimestamp('Failed to fetch grid weather data', 'error');
      return 1;
    }

  } catch (error) {
    logWithTimestamp(`Error during grid weather data update: ${error.message}`, 'error');
    console.error(error);
    return 1;
  }
}

// Run if called directly
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('gridWeatherCollector.js')
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
