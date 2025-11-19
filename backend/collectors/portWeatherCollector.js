import axios from 'axios';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../utils/database.js';
import {
  getPortMetadata,
  savePortMetadata,
  savePortWeatherData,
  isPortWeatherFresh
} from '../utils/weatherRepository.js';
import { sleep, createSlug, logWithTimestamp } from '../utils/helpers.js';
import config from '../config/config.js';

/**
 * Port Weather Collector
 * Fetches weather data for Indonesian ports using BMKG API
 */

/**
 * Default port list for Indonesia
 */
const DEFAULT_PORTS = [
  { name: 'Pelabuhan Sabang', lat: 5.8933, lon: 95.3214 },
  { name: 'Pelabuhan Belawan', lat: 3.7833, lon: 98.6833 },
  { name: 'Pelabuhan Dumai', lat: 1.6667, lon: 101.45 },
  { name: 'Pelabuhan Teluk Bayur', lat: -0.9833, lon: 100.3667 },
  { name: 'Pelabuhan Panjang', lat: -5.45, lon: 105.3167 },
  { name: 'Pelabuhan Tanjung Priok', lat: -6.1, lon: 106.8833 },
  { name: 'Pelabuhan Tanjung Perak', lat: -7.2167, lon: 112.7333 },
  { name: 'Pelabuhan Benoa', lat: -8.75, lon: 115.2167 },
  { name: 'Pelabuhan Pontianak', lat: -0.0333, lon: 109.3167 },
  { name: 'Pelabuhan Banjarmasin', lat: -3.3167, lon: 114.5833 },
  { name: 'Pelabuhan Balikpapan', lat: -1.2667, lon: 116.8333 },
  { name: 'Pelabuhan Samarinda', lat: -0.5, lon: 117.15 },
  { name: 'Pelabuhan Tarakan', lat: 3.3, lon: 117.6333 },
  { name: 'Pelabuhan Pantoloan', lat: -0.7, lon: 119.85 },
  { name: 'Pelabuhan Makassar', lat: -5.1167, lon: 119.4 },
  { name: 'Pelabuhan Kendari', lat: -3.9833, lon: 122.5833 },
  { name: 'Pelabuhan Bitung', lat: 1.45, lon: 125.1833 },
  { name: 'Pelabuhan Ternate', lat: 0.7833, lon: 127.3667 },
  { name: 'Pelabuhan Ambon', lat: -3.6833, lon: 128.1833 },
  { name: 'Pelabuhan Sorong', lat: -0.8667, lon: 131.25 },
  { name: 'Pelabuhan Jayapura', lat: -2.5333, lon: 140.7167 }
];

/**
 * Load port data from MongoDB or use default list
 */
async function loadPortData() {
  try {
    const metadata = await getPortMetadata();
    
    if (metadata && metadata.length > 0) {
      const ports = metadata
        .filter(doc => doc.lat != null && doc.lon != null)
        .map(doc => ({
          id: doc.slug || createSlug(doc.port_name || doc.name || ''),
          name: doc.port_name || doc.name,
          lat: doc.lat,
          lon: doc.lon,
          slug: doc.slug || createSlug(doc.port_name || doc.name || '')
        }));
      
      logWithTimestamp(`Loaded ${ports.length} ports from MongoDB port_metadata collection`, 'info');
      return ports;
    }
  } catch (error) {
    logWithTimestamp(`Error loading port metadata from MongoDB: ${error.message}`, 'warn');
  }

  // Use default port list
  const ports = DEFAULT_PORTS.map((port, index) => {
    const slug = createSlug(port.name);
    return {
      id: `PORT_${String(index + 1).padStart(3, '0')}`,
      name: port.name,
      lat: port.lat,
      lon: port.lon,
      slug: slug
    };
  });

  // Save to MongoDB for future use
  try {
    const metadataDocs = ports.map(port => ({
      slug: port.slug,
      port_name: port.name,
      lat: port.lat,
      lon: port.lon
    }));
    await savePortMetadata(metadataDocs);
    logWithTimestamp('Seeded port metadata to MongoDB', 'info');
  } catch (error) {
    logWithTimestamp(`Failed to seed port metadata: ${error.message}`, 'warn');
  }

  logWithTimestamp(`Loaded ${ports.length} ports from default list`, 'info');
  return ports;
}

/**
 * Fetch weather data for a single port
 */
async function fetchPortWeather(port) {
  try {
    const apiUrl = `${config.api.bmkgPortUrl}?slug=${port.slug}`;
    
    logWithTimestamp(`Fetching: ${port.name} -> ${port.slug}`, 'info');

    const response = await axios.get(apiUrl, { timeout: 30000 });

    if (response.status === 200 && response.data) {
      return {
        port_name: port.name,
        slug: port.slug,
        coordinates: { lat: port.lat, lon: port.lon },
        weather_data: response.data,
        fetched_at: new Date(),
        status: 'success'
      };
    } else {
      return {
        port_name: port.name,
        slug: port.slug,
        coordinates: { lat: port.lat, lon: port.lon },
        weather_data: null,
        fetched_at: new Date(),
        status: 'failed',
        error: `HTTP ${response.status}`
      };
    }

  } catch (error) {
    return {
      port_name: port.name,
      slug: port.slug,
      coordinates: { lat: port.lat, lon: port.lon },
      weather_data: null,
      fetched_at: new Date(),
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check if port weather data needs updating
 */
async function checkDataFreshness() {
  try {
    const fresh = await isPortWeatherFresh();
    if (fresh) {
      logWithTimestamp('Port weather data is still fresh (<= 6 hours old)', 'info');
    } else {
      logWithTimestamp('Port weather data is stale or missing. Update required.', 'info');
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
  logWithTimestamp('Port Weather Data Fetcher', 'info');
  logWithTimestamp('='.repeat(50), 'info');

  try {
    // Connect to database
    await connectDatabase();

    // Check if update is needed
    if (await checkDataFreshness()) {
      logWithTimestamp('Port weather data is still fresh. No update needed.', 'info');
      return 0;
    }

    // Load port data
    const ports = await loadPortData();
    
    if (!ports || ports.length === 0) {
      logWithTimestamp('No ports found. Exiting.', 'error');
      return 1;
    }

    logWithTimestamp(`Found ${ports.length} ports to process`, 'info');
    logWithTimestamp(`Estimated time: ~${Math.ceil(ports.length * 0.5 / 60)} minutes (with 500ms delays)`, 'info');
    logWithTimestamp('Starting data collection...\n', 'info');

    const results = [];
    let successful = 0;
    let failed = 0;

    // Process all ports
    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      logWithTimestamp(`[${String(i + 1).padStart(3, ' ')}/${ports.length}] Processing: ${port.name}`, 'info');

      const result = await fetchPortWeather(port);
      results.push(result);

      if (result.status === 'success') {
        successful++;
        logWithTimestamp('    Success', 'info');
      } else {
        failed++;
        logWithTimestamp(`    Failed: ${result.error || 'Unknown error'}`, 'warn');
      }

      // Progress update every 50 ports
      if ((i + 1) % 50 === 0) {
        logWithTimestamp(`\nProgress: ${i + 1}/${ports.length} (${((i + 1) / ports.length * 100).toFixed(1)}%)`, 'info');
        logWithTimestamp(`   Successful: ${successful}, Failed: ${failed}\n`, 'info');
      }

      // Add delay to avoid overwhelming BMKG API
      await sleep(config.collector.requestDelayMs);
    }

    // Final summary
    logWithTimestamp('\n' + '='.repeat(50), 'info');
    logWithTimestamp('FINAL RESULTS', 'info');
    logWithTimestamp('='.repeat(50), 'info');
    logWithTimestamp(`Total ports processed: ${ports.length}`, 'info');
    logWithTimestamp(`Successful: ${successful}`, 'info');
    logWithTimestamp(`Failed: ${failed}`, 'info');
    logWithTimestamp(`Success rate: ${(successful / ports.length * 100).toFixed(1)}%`, 'info');

    // Save results to MongoDB
    try {
      await savePortWeatherData(results);
      logWithTimestamp(`\nSaved ${results.length} port entries to MongoDB port_weather collection`, 'info');
    } catch (error) {
      logWithTimestamp(`\n❌ Failed to save port data to MongoDB: ${error.message}`, 'error');
      return 1;
    }

    if (successful > 0) {
      logWithTimestamp(`\nReady to integrate ${successful} ports into your weather map!`, 'info');
      return 0;
    } else {
      logWithTimestamp('\nNo successful data collected. Check your internet connection and API status.', 'warn');
      return 1;
    }

  } catch (error) {
    logWithTimestamp(`Error during port weather data update: ${error.message}`, 'error');
    console.error(error);
    return 1;
  }
}

// Run if called directly
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('portWeatherCollector.js')
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
