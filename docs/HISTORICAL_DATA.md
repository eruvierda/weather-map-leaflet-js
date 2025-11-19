# Historical Weather Data

The Weather Map application now includes automatic historical data archival. Every time new weather data is fetched, the old data is automatically archived to separate history collections before being replaced.

## Overview

### How It Works

1. **Automatic Archival**: When collectors fetch new weather data, the system automatically:
   - Archives existing data to history collections
   - Saves new data to current collections
   - Maintains data continuity

2. **Separate Collections**: Historical data is stored in dedicated collections:
   - `city_weather_history`
   - `grid_weather_history`
   - `port_weather_history`

3. **Query Historical Data**: Access past weather data through dedicated API endpoints

4. **Data Retention**: Configurable retention policy (default: 90 days)

## MongoDB Collections

### History Collections

#### city_weather_history
Stores archived city weather snapshots.

**Schema:**
```javascript
{
  name: String,              // City name
  lat: Number,               // Latitude
  lon: Number,               // Longitude
  coordinates: Object,       // Full coordinates
  weather_data: Object,      // Weather snapshot
  archived_at: Date,         // When archived (indexed)
  original_updated_at: Date  // Original update timestamp
}
```

**Indexes:**
- `{ name: 1, archived_at: -1 }`
- `{ 'weather_data.fetched_at': -1 }`

#### grid_weather_history
Stores archived grid weather snapshots.

**Schema:**
```javascript
{
  name: String,
  lat: Number,               // Indexed
  lon: Number,               // Indexed
  coordinates: Object,
  weather_data: Object,
  archived_at: Date,         // Indexed
  original_updated_at: Date
}
```

**Indexes:**
- `{ lat: 1, lon: 1, archived_at: -1 }`
- `{ 'weather_data.fetched_at': -1 }`

#### port_weather_history
Stores archived port weather snapshots.

**Schema:**
```javascript
{
  port_name: String,         // Indexed
  slug: String,              // Indexed
  coordinates: Object,
  weather_data: Object,
  fetched_at: Date,
  status: String,
  error: String,
  archived_at: Date,         // Indexed
  original_updated_at: Date
}
```

**Indexes:**
- `{ port_name: 1, archived_at: -1 }`
- `{ slug: 1, archived_at: -1 }`
- `{ fetched_at: -1 }`

## API Endpoints

### Get City Weather History

```http
GET /api/weather/city/history/:cityName
```

**Parameters:**
- `cityName` (path) - Name of the city

**Query Parameters:**
- `startDate` (optional) - ISO date string (e.g., "2024-01-01")
- `endDate` (optional) - ISO date string
- `limit` (optional) - Number of records to return (default: 100)

**Example:**
```bash
# Get last 100 records for Jakarta
curl http://localhost:8000/api/weather/city/history/Jakarta

# Get records from specific date range
curl "http://localhost:8000/api/weather/city/history/Jakarta?startDate=2024-01-01&endDate=2024-01-31"

# Get last 50 records
curl "http://localhost:8000/api/weather/city/history/Jakarta?limit=50"
```

**Response:**
```json
[
  {
    "name": "Jakarta",
    "lat": -6.2088,
    "lon": 106.8456,
    "weather_data": {
      "temperature_2m": 28.5,
      "relative_humidity_2m": 75,
      "fetched_at": "2024-01-15T12:00:00.000Z"
    },
    "archived_at": "2024-01-15T18:00:00.000Z",
    "original_updated_at": "2024-01-15T12:00:00.000Z"
  }
]
```

### Get Grid Weather History

```http
GET /api/weather/grid/history
```

**Query Parameters:**
- `lat` (required) - Latitude
- `lon` (required) - Longitude
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `limit` (optional) - Number of records (default: 100)

**Example:**
```bash
# Get history for specific grid point
curl "http://localhost:8000/api/weather/grid/history?lat=-6.0&lon=106.0"

# With date range
curl "http://localhost:8000/api/weather/grid/history?lat=-6.0&lon=106.0&startDate=2024-01-01&endDate=2024-01-31"
```

### Get Port Weather History

```http
GET /api/weather/port/history/:portSlug
```

**Parameters:**
- `portSlug` (path) - Port slug (e.g., "pelabuhan-tanjung-priok")

**Query Parameters:**
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `limit` (optional) - Number of records (default: 100)

**Example:**
```bash
# Get history for Tanjung Priok port
curl http://localhost:8000/api/weather/port/history/pelabuhan-tanjung-priok

# With date range
curl "http://localhost:8000/api/weather/port/history/pelabuhan-tanjung-priok?startDate=2024-01-01&limit=30"
```

### Cleanup Old History

```http
POST /api/weather/history/cleanup
```

**Body:**
```json
{
  "daysToKeep": 90
}
```

**Example:**
```bash
# Keep last 90 days (default)
curl -X POST http://localhost:8000/api/weather/history/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 90}'

# Keep last 30 days
curl -X POST http://localhost:8000/api/weather/history/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30}'
```

**Response:**
```json
{
  "message": "Historical data cleanup completed",
  "deleted": {
    "city": 150,
    "grid": 3500,
    "port": 80,
    "total": 3730
  }
}
```

## Command Line Usage

### Cleanup Historical Data

```bash
# Use default retention (90 days)
npm run cleanup:history

# Specify custom retention period
node backend/utils/cleanupHistory.js 30  # Keep 30 days
node backend/utils/cleanupHistory.js 180 # Keep 180 days
```

**Output:**
```
[2024-11-19 09:30:00] Historical Data Cleanup Utility
[2024-11-19 09:30:00] ==================================================
[2024-11-19 09:30:00] Retention policy: Keep last 90 days
[2024-11-19 09:30:00] 
[2024-11-19 09:30:01] Connected to MongoDB
[2024-11-19 09:30:01] Deleting records older than: 2024-08-21T02:30:01.000Z
[2024-11-19 09:30:01] 
[2024-11-19 09:30:01] Starting cleanup...
[2024-11-19 09:30:02] ==================================================
[2024-11-19 09:30:02] Cleanup Results:
[2024-11-19 09:30:02] ==================================================
[2024-11-19 09:30:02] City weather history deleted: 150
[2024-11-19 09:30:02] Grid weather history deleted: 3500
[2024-11-19 09:30:02] Port weather history deleted: 80
[2024-11-19 09:30:02] Total records deleted: 3730
[2024-11-19 09:30:02] ==================================================
[2024-11-19 09:30:02] ✅ Successfully cleaned up 3730 old records
```

## Data Flow

### When Collectors Run

```
1. Collector starts
   ↓
2. Check if data is fresh
   ↓
3. If stale, fetch new data from API
   ↓
4. Archive existing data to history
   ↓
5. Save new data to current collection
   ↓
6. Log results
```

### Archive Process

```javascript
// Automatic archival happens in weatherRepository.js

// Example: City weather
export async function saveCityWeatherData(data) {
  // 1. Archive existing data
  const cityNames = data.map(city => city.name);
  const archivedCount = await archiveCityWeather(cityNames);
  
  // 2. Save new data
  await CityWeather.bulkWrite(operations);
}
```

## Data Retention Policy

### Default Policy
- **Retention Period**: 90 days
- **Automatic Cleanup**: Manual (run cleanup script)
- **Storage**: MongoDB collections

### Recommended Schedule

```bash
# Daily cleanup (keeps last 90 days)
0 2 * * * cd /path/to/app && npm run cleanup:history >> logs/cleanup.log 2>&1

# Weekly cleanup (keeps last 180 days)
0 2 * * 0 cd /path/to/app && node backend/utils/cleanupHistory.js 180 >> logs/cleanup.log 2>&1

# Monthly cleanup (keeps last 365 days)
0 2 1 * * cd /path/to/app && node backend/utils/cleanupHistory.js 365 >> logs/cleanup.log 2>&1
```

## Storage Estimates

### Per Record Size
- City weather: ~500 bytes
- Grid weather: ~500 bytes
- Port weather: ~1-2 KB (varies by BMKG response)

### Daily Growth (assuming 4 updates/day)
- City (34 cities): ~68 KB/day
- Grid (782 points): ~1.5 MB/day
- Port (21 ports): ~168 KB/day
- **Total**: ~1.7 MB/day

### 90-Day Retention
- City: ~6 MB
- Grid: ~135 MB
- Port: ~15 MB
- **Total**: ~156 MB

## Querying Historical Data

### JavaScript Example

```javascript
import { getCityWeatherHistory } from './backend/utils/weatherRepository.js';

// Get last 30 days of Jakarta weather
const history = await getCityWeatherHistory('Jakarta', {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  limit: 1000
});

// Analyze temperature trends
const temperatures = history.map(record => ({
  date: record.archived_at,
  temp: record.weather_data.temperature_2m
}));
```

### MongoDB Query Example

```javascript
// Direct MongoDB query
db.city_weather_history.find({
  name: "Jakarta",
  archived_at: {
    $gte: ISODate("2024-01-01"),
    $lte: ISODate("2024-01-31")
  }
}).sort({ archived_at: -1 }).limit(100)
```

## Use Cases

### 1. Temperature Trends
Track temperature changes over time for specific locations.

### 2. Weather Pattern Analysis
Analyze historical weather patterns for predictions.

### 3. Data Verification
Compare current readings with historical data.

### 4. Reporting
Generate weather reports for specific time periods.

### 5. API Integration
Provide historical data to third-party applications.

## Best Practices

### 1. Regular Cleanup
Run cleanup script regularly to manage storage.

```bash
# Add to crontab
0 2 * * * cd /path/to/app && npm run cleanup:history
```

### 2. Monitor Storage
Check MongoDB storage usage regularly.

```javascript
// MongoDB shell
db.stats()
db.city_weather_history.stats()
```

### 3. Index Optimization
Ensure indexes are created for efficient queries.

```javascript
// Create indexes
db.city_weather_history.createIndex({ name: 1, archived_at: -1 })
db.grid_weather_history.createIndex({ lat: 1, lon: 1, archived_at: -1 })
db.port_weather_history.createIndex({ slug: 1, archived_at: -1 })
```

### 4. Backup Strategy
Include history collections in backup routines.

```bash
# Backup all collections including history
mongodump --uri="mongodb://localhost:27017" --db=weather_map --out=./backup
```

## Troubleshooting

### High Storage Usage

**Problem**: History collections growing too large

**Solution**:
```bash
# Reduce retention period
npm run cleanup:history
node backend/utils/cleanupHistory.js 30  # Keep only 30 days
```

### Slow Queries

**Problem**: Historical queries taking too long

**Solution**:
1. Ensure indexes are created
2. Limit query results
3. Use date range filters

### Missing Historical Data

**Problem**: No historical data available

**Solution**:
- Historical data only exists after first update
- Run collectors multiple times to build history
- Check if archival is working (look for 📦 emoji in logs)

## Future Enhancements

### Planned Features
1. **Aggregated Statistics**: Pre-calculated daily/weekly/monthly averages
2. **Data Export**: Export historical data to CSV/JSON
3. **Visualization**: Built-in charts for historical trends
4. **Automated Cleanup**: Configurable automatic cleanup
5. **Compression**: Compress old historical data

---

**Note**: Historical data feature is automatically enabled. No configuration required. Data is archived every time collectors run.
