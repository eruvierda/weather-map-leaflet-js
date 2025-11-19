# Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0
- A server or cloud platform (VPS, AWS, Azure, etc.)

## Production Setup

### 1. Environment Configuration

Create a `.env` file with production settings:

```bash
# MongoDB Configuration
MONGO_URI=mongodb://your-mongodb-host:27017
MONGO_DB=weather_map

# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# API Configuration
OPENMETEO_API_URL=https://api.open-meteo.com/v1/forecast
BMKG_PORT_API_URL=https://maritim.bmkg.go.id/api/pelabuhan

# Cache Configuration (in seconds)
CACHE_TTL_CITY=21600
CACHE_TTL_GRID=43200
CACHE_TTL_PORT=21600

# Data Freshness Thresholds (in hours)
FRESHNESS_CITY=6
FRESHNESS_GRID=12
FRESHNESS_PORT=6

# Collector Configuration
BATCH_SIZE=50
REQUEST_DELAY_MS=500
MAX_RETRIES=3
```

### 2. Install Dependencies

```bash
npm ci --production
```

### 3. Start the Server

#### Using Node.js directly

```bash
node backend/server.js
```

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start backend/server.js --name weather-map

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 4. Setup Data Collection

Configure cron jobs to run collectors periodically:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths as needed):
# Run city weather collector every 6 hours
0 */6 * * * cd /path/to/weather-map-leaflet-JS && /usr/bin/node backend/collectors/cityWeatherCollector.js >> logs/city-collector.log 2>&1

# Run grid weather collector every 12 hours
0 */12 * * * cd /path/to/weather-map-leaflet-JS && /usr/bin/node backend/collectors/gridWeatherCollector.js >> logs/grid-collector.log 2>&1

# Run port weather collector every 6 hours
30 */6 * * * cd /path/to/weather-map-leaflet-JS && /usr/bin/node backend/collectors/portWeatherCollector.js >> logs/port-collector.log 2>&1

# Or run all collectors at once
0 */6 * * * cd /path/to/weather-map-leaflet-JS && /usr/bin/node backend/collectors/runAllCollectors.js >> logs/all-collectors.log 2>&1
```

### 5. Reverse Proxy Setup (Nginx)

Create an Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/weather-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

### Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 8000

CMD ["node", "backend/server.js"]
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: weather_map

  weather-app:
    build: .
    restart: always
    ports:
      - "8000:8000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - MONGO_DB=weather_map
      - NODE_ENV=production
    depends_on:
      - mongodb

volumes:
  mongodb_data:
```

Build and run:

```bash
docker-compose up -d
```

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs weather-map

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Health Check

Setup a monitoring service to ping:
```
http://your-domain.com/api/health
```

## Backup Strategy

### MongoDB Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
mongodump --uri="mongodb://localhost:27017" --db=weather_map --out="$BACKUP_DIR/backup_$DATE"
# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh >> /path/to/logs/backup.log 2>&1
```

## Troubleshooting

### Check Logs

```bash
# PM2 logs
pm2 logs weather-map

# Collector logs
tail -f logs/all-collectors.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
mongosh mongodb://localhost:27017/weather_map
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

## Security Considerations

1. **Firewall**: Only expose necessary ports (80, 443)
2. **MongoDB**: Enable authentication and use strong passwords
3. **Environment Variables**: Never commit `.env` to version control
4. **CORS**: Configure CORS properly for production
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **HTTPS**: Always use HTTPS in production
7. **Updates**: Keep dependencies updated regularly

## Performance Optimization

1. **MongoDB Indexes**: Ensure all recommended indexes are created
2. **Caching**: Configure appropriate cache TTL values
3. **Compression**: Enable gzip compression in Nginx
4. **CDN**: Use CDN for static assets if needed
5. **Connection Pooling**: MongoDB connection pooling is handled by Mongoose

## Scaling

For high-traffic scenarios:

1. **Horizontal Scaling**: Run multiple instances behind a load balancer
2. **MongoDB Replica Set**: Setup MongoDB replica set for high availability
3. **Caching Layer**: Add Redis for API response caching
4. **CDN**: Serve static files through CDN
