import express from 'express';
import {
  getCityWeatherDocuments,
  getGridWeatherDocuments,
  getPortWeatherDocuments,
  getPortMetadata,
  getLatestCityFetchTime,
  getLatestGridFetchTime,
  getLatestPortTime,
  getCityWeatherHistory,
  getGridWeatherHistory,
  getPortWeatherHistory,
  cleanupOldHistory
} from '../utils/weatherRepository.js';

const router = express.Router();

/**
 * GET /api/weather/city
 * Get all city weather data
 */
router.get('/city', async (req, res) => {
  try {
    const data = await getCityWeatherDocuments();
    res.json(data);
  } catch (error) {
    console.error('Error fetching city weather:', error);
    res.status(500).json({ error: 'Failed to fetch city weather data' });
  }
});

/**
 * GET /api/weather/grid
 * Get all grid weather data
 */
router.get('/grid', async (req, res) => {
  try {
    const data = await getGridWeatherDocuments();
    res.json(data);
  } catch (error) {
    console.error('Error fetching grid weather:', error);
    res.status(500).json({ error: 'Failed to fetch grid weather data' });
  }
});

/**
 * GET /api/weather/port
 * Get all port weather data
 */
router.get('/port', async (req, res) => {
  try {
    const data = await getPortWeatherDocuments();
    res.json(data);
  } catch (error) {
    console.error('Error fetching port weather:', error);
    res.status(500).json({ error: 'Failed to fetch port weather data' });
  }
});

/**
 * GET /api/weather/port/metadata
 * Get port metadata
 */
router.get('/port/metadata', async (req, res) => {
  try {
    const data = await getPortMetadata();
    res.json(data);
  } catch (error) {
    console.error('Error fetching port metadata:', error);
    res.status(500).json({ error: 'Failed to fetch port metadata' });
  }
});

/**
 * GET /api/weather/all
 * Get all weather data (city, grid, port)
 */
router.get('/all', async (req, res) => {
  try {
    const [cityData, gridData, portData] = await Promise.all([
      getCityWeatherDocuments(),
      getGridWeatherDocuments(),
      getPortWeatherDocuments()
    ]);

    res.json({
      city: cityData,
      grid: gridData,
      port: portData
    });
  } catch (error) {
    console.error('Error fetching all weather data:', error);
    res.status(500).json({ error: 'Failed to fetch all weather data' });
  }
});

/**
 * GET /api/weather/summary
 * Get weather data summary
 */
router.get('/summary', async (req, res) => {
  try {
    const [cityLatest, gridLatest, portLatest, cityData, gridData, portData] = await Promise.all([
      getLatestCityFetchTime(),
      getLatestGridFetchTime(),
      getLatestPortTime(),
      getCityWeatherDocuments(),
      getGridWeatherDocuments(),
      getPortWeatherDocuments()
    ]);

    res.json({
      city: {
        latest: cityLatest ? cityLatest.toISOString() : null,
        count: cityData.length
      },
      grid: {
        latest: gridLatest ? gridLatest.toISOString() : null,
        count: gridData.length
      },
      port: {
        latest: portLatest ? portLatest.toISOString() : null,
        count: portData.length
      }
    });
  } catch (error) {
    console.error('Error fetching weather summary:', error);
    res.status(500).json({ error: 'Failed to fetch weather summary' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===================== HISTORICAL DATA ENDPOINTS =====================

/**
 * GET /api/weather/city/history/:cityName
 * Get historical weather data for a specific city
 * Query params: startDate, endDate, limit
 */
router.get('/city/history/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      limit: limit ? parseInt(limit) : 100
    };
    
    const data = await getCityWeatherHistory(cityName, options);
    res.json(data);
  } catch (error) {
    console.error('Error fetching city weather history:', error);
    res.status(500).json({ error: 'Failed to fetch city weather history' });
  }
});

/**
 * GET /api/weather/grid/history
 * Get historical weather data for a specific grid point
 * Query params: lat, lon, startDate, endDate, limit
 */
router.get('/grid/history', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate, limit } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon query parameters are required' });
    }
    
    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      limit: limit ? parseInt(limit) : 100
    };
    
    const data = await getGridWeatherHistory(parseFloat(lat), parseFloat(lon), options);
    res.json(data);
  } catch (error) {
    console.error('Error fetching grid weather history:', error);
    res.status(500).json({ error: 'Failed to fetch grid weather history' });
  }
});

/**
 * GET /api/weather/port/history/:portSlug
 * Get historical weather data for a specific port
 * Query params: startDate, endDate, limit
 */
router.get('/port/history/:portSlug', async (req, res) => {
  try {
    const { portSlug } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      limit: limit ? parseInt(limit) : 100
    };
    
    const data = await getPortWeatherHistory(portSlug, options);
    res.json(data);
  } catch (error) {
    console.error('Error fetching port weather history:', error);
    res.status(500).json({ error: 'Failed to fetch port weather history' });
  }
});

/**
 * POST /api/weather/history/cleanup
 * Clean up old historical data
 * Body: { daysToKeep: number } (default: 90)
 */
router.post('/history/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const result = await cleanupOldHistory(daysToKeep);
    res.json({
      message: 'Historical data cleanup completed',
      deleted: result
    });
  } catch (error) {
    console.error('Error cleaning up historical data:', error);
    res.status(500).json({ error: 'Failed to cleanup historical data' });
  }
});

export default router;
