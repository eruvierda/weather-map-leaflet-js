# Weather Map - LeafletJS with MongoDB (Full JavaScript Stack)

A comprehensive weather visualization application using LeafletJS for interactive maps and MongoDB for data storage. This is a full JavaScript/Node.js implementation.

## 🚀 Features

- **Interactive Weather Map**: Real-time weather visualization using LeafletJS
- **Multiple Data Sources**:
  - City weather data (OpenMeteo API)
  - 1-degree grid weather data
  - Port weather data (BMKG API)
- **Temperature Heatmap**: Visual temperature distribution across regions
- **Historical Data**: Automatic archival of past weather data with query API
- **Smart Caching**: Efficient data caching with configurable TTL
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **RESTful API**: Express-based API server with historical endpoints
- **Automated Collectors**: Background data collection scripts
- **Data Retention**: Configurable historical data retention policy

## 📁 Project Structure

```
weather-map-leaflet-JS/
├─ backend/              # Node.js backend
│  ├─ api/              # Express routes
│  │  └─ weatherRoutes.js
│  ├─ collectors/       # Data collector scripts
│  │  ├─ cityWeatherCollector.js
│  │  ├─ gridWeatherCollector.js
│  │  ├─ portWeatherCollector.js
│  │  └─ runAllCollectors.js
│  ├─ models/           # Mongoose schemas
│  │  ├─ CityWeather.js
│  │  ├─ GridWeather.js
│  │  ├─ PortWeather.js
│  │  ├─ Metadata.js
│  │  └─ WeatherHistory.js
│  ├─ utils/            # Utility functions
│  │  ├─ database.js
│  │  ├─ weatherRepository.js
│  │  ├─ helpers.js
│  │  └─ cleanupHistory.js
│  ├─ config/           # Configuration
│  │  └─ config.js
│  └─ server.js         # Main server file
├─ frontend/            # Frontend files
│  ├─ index.html
│  ├─ css/
│  └─ js/
├─ data/                # Data files and schemas
│  └─ README.md
├─ docs/                # Documentation
│  ├─ API.md
│  ├─ DEPLOYMENT.md
│  └─ HISTORICAL_DATA.md
├─ scripts/             # Deployment scripts
│  └─ setup.sh
├─ .env.example         # Environment variables template
├─ .gitignore
├─ package.json
└─ README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-map-leaflet-JS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGO_URI in .env
   ```

5. **Run the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:8000`

## 📊 Data Collection

### Collect Weather Data

```bash
# Collect city weather data
npm run collect:city

# Collect grid weather data
npm run collect:grid

# Collect port weather data
npm run collect:port

# Run all collectors
npm run collect:all
```

### Automated Collection

Set up cron jobs or scheduled tasks to run collectors periodically:

```bash
# Example cron job (every 6 hours)
0 */6 * * * cd /path/to/project && npm run collect:all
```

## 🔌 API Endpoints

### Weather Data

- `GET /api/weather/city` - Get all city weather data
- `GET /api/weather/grid` - Get all grid weather data
- `GET /api/weather/port` - Get all port weather data
- `GET /api/weather/all` - Get all weather data
- `GET /api/weather/summary` - Get data summary

### Metadata

- `GET /api/weather/port/metadata` - Get port metadata

See [API Documentation](docs/API.md) for detailed endpoint information.

## 🗄️ MongoDB Collections

- `city_weather` - City weather snapshots
- `grid_weather` - 1° grid weather snapshots
- `port_weather` - Port weather snapshots
- `city_metadata` - City reference data
- `grid_metadata` - Grid point reference data
- `port_metadata` - Port reference data

## 🔧 Configuration

Key configuration options in `.env`:

- **MONGO_URI**: MongoDB connection string
- **PORT**: Server port (default: 8000)
- **CACHE_TTL_***: Cache time-to-live in seconds
- **FRESHNESS_***: Data freshness thresholds in hours
- **BATCH_SIZE**: Batch size for API requests
- **REQUEST_DELAY_MS**: Delay between API requests

## 🚢 Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for production deployment instructions.

## 📝 License

MIT

## 👤 Author

Ahmad Firdaus

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
