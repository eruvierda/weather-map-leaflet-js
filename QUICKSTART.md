# Quick Start Guide

Get your Weather Map application up and running in minutes!

## Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **MongoDB** >= 5.0 ([Download](https://www.mongodb.com/try/download/community))
- **npm** >= 9.0.0 (comes with Node.js)

## Installation

### 1. Clone or Navigate to the Project

```bash
cd weather-map-leaflet-JS
```

### 2. Run Setup Script

**On Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**On Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Or manually:**
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Create logs directory
mkdir logs
```

### 3. Configure Environment

Edit `.env` file with your settings:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB=weather_map

# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development
```

### 4. Start MongoDB

**Windows:**
```powershell
# If MongoDB is installed as a service, it should already be running
# Otherwise, start it manually:
mongod --dbpath C:\data\db
```

**Linux/Mac:**
```bash
# Start MongoDB service
sudo systemctl start mongodb
# or
sudo service mongodb start
```

### 5. Start the Server

```bash
npm start
```

You should see:
```
🚀 Weather API Server Running
================================
   Environment: development
   URL: http://0.0.0.0:8000
   Database: weather_map
================================
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## Collect Weather Data

Before you can see weather data on the map, you need to collect it:

### Collect All Data at Once

```bash
npm run collect:all
```

This will fetch:
- City weather data (~34 cities)
- Grid weather data (~782 grid points)
- Port weather data (~21 ports)

**Note:** Grid collection may take 10-15 minutes due to API rate limits.

### Or Collect Data Individually

```bash
# City weather (fast, ~30 seconds)
npm run collect:city

# Grid weather (slow, ~10-15 minutes)
npm run collect:grid

# Port weather (medium, ~2-3 minutes)
npm run collect:port
```

## Verify Everything Works

### 1. Check API Health

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### 2. Check Data Summary

```bash
curl http://localhost:8000/api/weather/summary
```

Expected response:
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

### 3. View the Map

Open http://localhost:8000 in your browser and you should see:
- Interactive map of Indonesia
- Weather data markers
- Layer controls to switch between city, grid, and port data

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

## Common Commands

```bash
# Start server
npm start

# Start in development mode (auto-reload)
npm run dev

# Collect all weather data
npm run collect:all

# Collect specific data
npm run collect:city
npm run collect:grid
npm run collect:port

# View logs (if using PM2)
pm2 logs weather-map
```

## Scheduled Data Collection

To keep your weather data fresh, set up scheduled tasks:

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set trigger: Every 6 hours
4. Set action: Run `node backend/collectors/runAllCollectors.js`

### Linux/Mac (Cron)

```bash
# Edit crontab
crontab -e

# Add this line to run every 6 hours
0 */6 * * * cd /path/to/weather-map-leaflet-JS && node backend/collectors/runAllCollectors.js >> logs/collectors.log 2>&1
```

## Troubleshooting

### Server Won't Start

**Error: Port 8000 already in use**
```bash
# Find process using port 8000
# Windows:
netstat -ano | findstr :8000
# Linux/Mac:
lsof -i :8000

# Change port in .env file
PORT=8001
```

**Error: Cannot connect to MongoDB**
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB
# Linux/Mac:
sudo systemctl status mongodb

# Verify connection
mongosh mongodb://localhost:27017/weather_map
```

### No Data Showing on Map

1. **Collect data first:**
   ```bash
   npm run collect:all
   ```

2. **Check data summary:**
   ```bash
   curl http://localhost:8000/api/weather/summary
   ```

3. **Check browser console** for errors (F12)

### Collector Fails

**OpenMeteo API Rate Limit:**
- Wait a few minutes and try again
- The collector has built-in retry logic
- Grid collection is batched to respect rate limits

**BMKG API Timeout:**
- Some ports may fail due to API issues
- This is normal, successful ports will still be saved
- Retry later for failed ports

## Next Steps

1. **Explore the API**: See [API Documentation](docs/API.md)
2. **Deploy to Production**: See [Deployment Guide](docs/DEPLOYMENT.md)
3. **Customize**: Modify frontend in `frontend/` directory
4. **Add Features**: Extend collectors or API endpoints

## Getting Help

- **Documentation**: Check `README.md` and `docs/` folder
- **Migration Guide**: See `MIGRATION.md` for Python comparison
- **Issues**: Check console logs and `logs/` directory

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Start Server | `npm start` |
| Dev Mode | `npm run dev` |
| Collect Data | `npm run collect:all` |
| Health Check | `curl http://localhost:8000/api/health` |
| View Map | `http://localhost:8000` |

---

**Congratulations!** 🎉 Your Weather Map application is now running!

For more detailed information, see the full [README.md](README.md).
