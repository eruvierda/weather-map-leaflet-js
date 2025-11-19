# API Documentation

## Base URL

```
http://localhost:8000/api
```

## Endpoints

### Weather Data

#### Get City Weather

```http
GET /api/weather/city
```

Returns all city weather data.

**Response:**
```json
[
  {
    "name": "Jakarta",
    "lat": -6.2088,
    "lon": 106.8456,
    "coordinates": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "elevation": 8
    },
    "weather_data": {
      "temperature_2m": 28.5,
      "relative_humidity_2m": 75,
      "weather_code": 3,
      "wind_speed_10m": 12.5,
      "wind_direction_10m": 180,
      "timestamp": 1234567890,
      "timezone": "Asia/Jakarta",
      "utc_offset_seconds": 25200,
      "fetched_at": "2024-01-01T12:00:00.000Z"
    },
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
]
```

#### Get Grid Weather

```http
GET /api/weather/grid
```

Returns all 1-degree grid weather data.

**Response:** Similar structure to city weather.

#### Get Port Weather

```http
GET /api/weather/port
```

Returns all port weather data.

**Response:**
```json
[
  {
    "port_name": "Pelabuhan Tanjung Priok",
    "slug": "pelabuhan-tanjung-priok",
    "coordinates": {
      "lat": -6.1,
      "lon": 106.8833
    },
    "weather_data": {
      // BMKG API response data
    },
    "fetched_at": "2024-01-01T12:00:00.000Z",
    "status": "success",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
]
```

#### Get Port Metadata

```http
GET /api/weather/port/metadata
```

Returns port metadata (names, coordinates, slugs).

**Response:**
```json
[
  {
    "slug": "pelabuhan-tanjung-priok",
    "port_name": "Pelabuhan Tanjung Priok",
    "lat": -6.1,
    "lon": 106.8833,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
]
```

#### Get All Weather Data

```http
GET /api/weather/all
```

Returns all weather data (city, grid, and port) in a single response.

**Response:**
```json
{
  "city": [...],
  "grid": [...],
  "port": [...]
}
```

#### Get Weather Summary

```http
GET /api/weather/summary
```

Returns a summary of available weather data.

**Response:**
```json
{
  "city": {
    "latest": "2024-01-01T12:00:00.000Z",
    "count": 34
  },
  "grid": {
    "latest": "2024-01-01T12:00:00.000Z",
    "count": 782
  },
  "port": {
    "latest": "2024-01-01T12:00:00.000Z",
    "count": 21
  }
}
```

### Health Check

#### Get Server Health

```http
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 12345.67,
  "environment": "development"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `404` - Not Found
- `500` - Internal Server Error

## CORS

CORS is enabled for all origins in development mode. Configure appropriately for production.

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting middleware for production deployments.
