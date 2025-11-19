import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '8000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || 'weather_map',
    collections: {
      city: process.env.CITY_COLLECTION || 'city_weather',
      grid: process.env.GRID_COLLECTION || 'grid_weather',
      port: process.env.PORT_COLLECTION || 'port_weather',
      cityMetadata: process.env.CITY_METADATA_COLLECTION || 'city_metadata',
      gridMetadata: process.env.GRID_METADATA_COLLECTION || 'grid_metadata',
      portMetadata: process.env.PORT_METADATA_COLLECTION || 'port_metadata'
    }
  },

  // API Configuration
  api: {
    openMeteoUrl: process.env.OPENMETEO_API_URL || 'https://api.open-meteo.com/v1/forecast',
    bmkgPortUrl: process.env.BMKG_PORT_API_URL || 'https://maritim.bmkg.go.id/api/pelabuhan'
  },

  // Cache Configuration (in seconds)
  cache: {
    ttl: {
      city: parseInt(process.env.CACHE_TTL_CITY || '21600', 10), // 6 hours
      grid: parseInt(process.env.CACHE_TTL_GRID || '43200', 10), // 12 hours
      port: parseInt(process.env.CACHE_TTL_PORT || '21600', 10)  // 6 hours
    }
  },

  // Data Freshness Thresholds (in hours)
  freshness: {
    city: parseInt(process.env.FRESHNESS_CITY || '6', 10),
    grid: parseInt(process.env.FRESHNESS_GRID || '12', 10),
    port: parseInt(process.env.FRESHNESS_PORT || '6', 10)
  },

  // Collector Configuration
  collector: {
    batchSize: parseInt(process.env.BATCH_SIZE || '50', 10),
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '500', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10)
  }
};

export default config;
