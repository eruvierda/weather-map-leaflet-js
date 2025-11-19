# Data

MongoDB is the canonical data store for the Weather Map project.

## Collections

- `city_weather` – City weather snapshots
- `grid_weather` – 1° grid weather snapshots
- `port_weather` – Port weather snapshots
- `city_metadata` – City reference data
- `grid_metadata` – Grid point reference data
- `port_metadata` – Port reference data

## Schema

### City Weather & Grid Weather

Each weather document includes:
- Location identifiers (`name`, `lat`, `lon`)
- `coordinates` object with `latitude`, `longitude`, `elevation`
- `weather_data` with fields:
  - `temperature_2m` - Temperature at 2 meters (°C)
  - `relative_humidity_2m` - Relative humidity at 2 meters (%)
  - `weather_code` - WMO weather code
  - `wind_speed_10m` - Wind speed at 10 meters (km/h)
  - `wind_direction_10m` - Wind direction at 10 meters (degrees)
  - `timestamp` - Unix timestamp
  - `timezone` - Timezone string
  - `utc_offset_seconds` - UTC offset in seconds
  - `fetched_at` - ISO datetime when data was fetched
- `updated_at` - Last update timestamp

### Port Weather

Each port weather document includes:
- `port_name` - Name of the port
- `slug` - URL-friendly identifier
- `coordinates` - Object with `lat` and `lon`
- `weather_data` - BMKG API response data (varies by port)
- `fetched_at` - ISO datetime when data was fetched
- `status` - Status of fetch ('success', 'failed', 'error')
- `error` - Error message if fetch failed
- `updated_at` - Last update timestamp

## Indexes (recommended)

```js
// City Weather
db.city_weather.createIndex({ "name": 1, "weather_data.fetched_at": -1 })

// Grid Weather
db.grid_weather.createIndex({ "lat": 1, "lon": 1, "weather_data.fetched_at": -1 })

// Port Weather
db.port_weather.createIndex({ "port_name": 1, "fetched_at": -1 })
db.port_weather.createIndex({ "slug": 1 })

// Metadata Collections
db.city_metadata.createIndex({ "name": 1 })
db.grid_metadata.createIndex({ "lat": 1, "lon": 1 })
db.port_metadata.createIndex({ "slug": 1 })
```

## Data Sources

- **City & Grid Weather**: [OpenMeteo API](https://open-meteo.com/)
- **Port Weather**: [BMKG Maritime API](https://maritim.bmkg.go.id/)

## Backups/Exports

Use `mongodump` and `mongorestore` for backups:

```bash
# Backup
mongodump --uri="mongodb://localhost:27017" --db=weather_map --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017" --db=weather_map ./backup/weather_map
```

## Data Freshness

The application checks data freshness before fetching new data:
- **City Weather**: 6 hours
- **Grid Weather**: 12 hours
- **Port Weather**: 6 hours

Configure these thresholds in `.env` file.
