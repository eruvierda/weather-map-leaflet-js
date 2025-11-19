# Project Structure

Complete directory tree and file organization for the Weather Map JavaScript application.

## Directory Tree

```
weather-map-leaflet-JS/
│
├── backend/                          # Backend Node.js application
│   ├── api/                         # API routes
│   │   └── weatherRoutes.js         # Weather API endpoints (7 routes)
│   │
│   ├── collectors/                  # Data collection scripts
│   │   ├── cityWeatherCollector.js  # City weather collector (OpenMeteo)
│   │   ├── gridWeatherCollector.js  # Grid weather collector (OpenMeteo)
│   │   ├── portWeatherCollector.js  # Port weather collector (BMKG)
│   │   └── runAllCollectors.js      # Orchestrator for all collectors
│   │
│   ├── config/                      # Configuration
│   │   └── config.js                # Centralized config with env vars
│   │
│   ├── models/                      # Mongoose schemas
│   │   ├── CityWeather.js           # City weather schema
│   │   ├── GridWeather.js           # Grid weather schema
│   │   ├── PortWeather.js           # Port weather schema
│   │   └── Metadata.js              # Metadata schemas (city, grid, port)
│   │
│   ├── utils/                       # Utility functions
│   │   ├── database.js              # MongoDB connection management
│   │   ├── helpers.js               # Helper functions (sleep, slug, etc.)
│   │   └── weatherRepository.js     # Data operations (CRUD, freshness)
│   │
│   └── server.js                    # Main Express server entry point
│
├── frontend/                         # Frontend files
│   ├── scripts/                     # JavaScript files
│   │   └── smart_cache_manager.js   # Client-side cache management
│   │
│   └── index.html                   # Main HTML file with LeafletJS map
│
├── data/                            # Data documentation
│   └── README.md                    # Database schema documentation
│
├── docs/                            # Documentation
│   ├── API.md                       # API endpoint documentation
│   └── DEPLOYMENT.md                # Production deployment guide
│
├── scripts/                         # Setup and utility scripts
│   ├── setup.sh                     # Linux/Mac setup script
│   └── setup.ps1                    # Windows PowerShell setup script
│
├── logs/                            # Log files (created at runtime)
│   ├── city-collector.log           # City collector logs
│   ├── grid-collector.log           # Grid collector logs
│   ├── port-collector.log           # Port collector logs
│   └── all-collectors.log           # All collectors logs
│
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # Node.js dependencies and scripts
├── package-lock.json                # Locked dependency versions
│
├── README.md                        # Main project documentation
├── QUICKSTART.md                    # Quick start guide
├── MIGRATION.md                     # Python to JavaScript migration guide
├── PROJECT_SUMMARY.md               # Comprehensive project summary
├── CHANGELOG.md                     # Version history and changes
└── STRUCTURE.md                     # This file
```

## File Descriptions

### Backend Files

#### API Layer
| File | Lines | Purpose |
|------|-------|---------|
| `backend/api/weatherRoutes.js` | ~140 | Express routes for weather API endpoints |

#### Collectors
| File | Lines | Purpose |
|------|-------|---------|
| `backend/collectors/cityWeatherCollector.js` | ~200 | Collects city weather from OpenMeteo |
| `backend/collectors/gridWeatherCollector.js` | ~250 | Collects grid weather with batching |
| `backend/collectors/portWeatherCollector.js` | ~200 | Collects port weather from BMKG |
| `backend/collectors/runAllCollectors.js` | ~100 | Orchestrates all collectors |

#### Models
| File | Lines | Purpose |
|------|-------|---------|
| `backend/models/CityWeather.js` | ~50 | Mongoose schema for city weather |
| `backend/models/GridWeather.js` | ~50 | Mongoose schema for grid weather |
| `backend/models/PortWeather.js` | ~50 | Mongoose schema for port weather |
| `backend/models/Metadata.js` | ~80 | Mongoose schemas for metadata |

#### Utilities
| File | Lines | Purpose |
|------|-------|---------|
| `backend/utils/database.js` | ~80 | MongoDB connection management |
| `backend/utils/helpers.js` | ~150 | Utility functions (sleep, slug, etc.) |
| `backend/utils/weatherRepository.js` | ~300 | Data CRUD operations |

#### Configuration
| File | Lines | Purpose |
|------|-------|---------|
| `backend/config/config.js` | ~70 | Centralized configuration |
| `backend/server.js` | ~120 | Main Express server |

### Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/index.html` | ~2000 | Main HTML with LeafletJS map |
| `frontend/scripts/smart_cache_manager.js` | ~200 | Client-side cache management |

### Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| `README.md` | ~250 | Main project documentation |
| `QUICKSTART.md` | ~300 | Quick start guide |
| `MIGRATION.md` | ~500 | Migration guide from Python |
| `PROJECT_SUMMARY.md` | ~400 | Comprehensive project summary |
| `CHANGELOG.md` | ~300 | Version history |
| `STRUCTURE.md` | ~200 | This file |
| `docs/API.md` | ~200 | API documentation |
| `docs/DEPLOYMENT.md` | ~400 | Deployment guide |
| `data/README.md` | ~100 | Database schema docs |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js dependencies and scripts |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore rules |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/setup.sh` | Linux/Mac setup automation |
| `scripts/setup.ps1` | Windows setup automation |

## Module Dependencies

### Backend Dependencies Graph

```
server.js
├── config/config.js
├── utils/database.js
│   └── mongoose
├── api/weatherRoutes.js
│   └── utils/weatherRepository.js
│       ├── models/CityWeather.js
│       ├── models/GridWeather.js
│       ├── models/PortWeather.js
│       ├── models/Metadata.js
│       └── utils/helpers.js
└── express, cors

collectors/cityWeatherCollector.js
├── utils/database.js
├── utils/weatherRepository.js
├── utils/helpers.js
├── config/config.js
└── axios

collectors/gridWeatherCollector.js
├── utils/database.js
├── utils/weatherRepository.js
├── utils/helpers.js
├── config/config.js
└── axios

collectors/portWeatherCollector.js
├── utils/database.js
├── utils/weatherRepository.js
├── utils/helpers.js
├── config/config.js
└── axios

collectors/runAllCollectors.js
├── utils/database.js
├── utils/helpers.js
├── collectors/cityWeatherCollector.js
├── collectors/gridWeatherCollector.js
└── collectors/portWeatherCollector.js
```

## Data Flow

### API Request Flow
```
Client Request
    ↓
Express Server (server.js)
    ↓
Route Handler (weatherRoutes.js)
    ↓
Repository Function (weatherRepository.js)
    ↓
Mongoose Model (CityWeather/GridWeather/PortWeather)
    ↓
MongoDB Database
    ↓
Response to Client
```

### Data Collection Flow
```
Collector Script
    ↓
Load Metadata (weatherRepository.js)
    ↓
Check Freshness (helpers.js)
    ↓
Fetch from External API (axios)
    ↓
Process Data
    ↓
Save to MongoDB (weatherRepository.js)
    ↓
Log Results
```

## Key Directories

### `/backend`
Core backend application with all server-side logic.

**Subdirectories:**
- `api/` - Express routes and endpoints
- `collectors/` - Data collection scripts
- `config/` - Configuration management
- `models/` - Mongoose schemas
- `utils/` - Utility functions

### `/frontend`
Client-side files served by Express.

**Contents:**
- HTML, CSS, JavaScript for the map interface
- LeafletJS integration
- Cache management

### `/docs`
Comprehensive documentation.

**Contents:**
- API documentation
- Deployment guides
- Architecture docs

### `/scripts`
Setup and utility scripts.

**Contents:**
- Installation scripts
- Deployment scripts
- Maintenance scripts

### `/logs`
Runtime log files (created automatically).

**Contents:**
- Collector logs
- Server logs
- Error logs

## File Sizes (Approximate)

| Category | Files | Total Size |
|----------|-------|------------|
| Backend Code | 15 | ~30 KB |
| Frontend Code | 2 | ~100 KB |
| Documentation | 9 | ~150 KB |
| Configuration | 3 | ~5 KB |
| Scripts | 2 | ~10 KB |
| Dependencies | node_modules | ~50 MB |
| **Total** | **31+** | **~50 MB** |

## Code Statistics

### Backend
- **Total Lines**: ~2,000
- **JavaScript Files**: 15
- **Average File Size**: ~130 lines

### Frontend
- **Total Lines**: ~2,200
- **HTML/JS Files**: 2
- **Average File Size**: ~1,100 lines

### Documentation
- **Total Lines**: ~2,500
- **Markdown Files**: 9
- **Average File Size**: ~280 lines

### Total Project
- **Total Lines**: ~6,700
- **Total Files**: 31+
- **Languages**: JavaScript (95%), Markdown (5%)

## Import/Export Patterns

### ES6 Modules (Used Throughout)

```javascript
// Named exports
export { function1, function2 };
export default MainFunction;

// Named imports
import { function1, function2 } from './module.js';
import MainFunction from './module.js';
```

### Common Patterns

```javascript
// Config
import config from '../config/config.js';

// Database
import { connectDatabase } from '../utils/database.js';

// Models
import CityWeather from '../models/CityWeather.js';

// Repository
import { getCityWeatherDocuments } from '../utils/weatherRepository.js';

// Helpers
import { sleep, logWithTimestamp } from '../utils/helpers.js';
```

## Environment Files

### `.env` (Not in Git)
Contains actual configuration values.

### `.env.example` (In Git)
Template with example values and documentation.

## Log Files

### Collector Logs
- `logs/city-collector.log` - City weather collection logs
- `logs/grid-collector.log` - Grid weather collection logs
- `logs/port-collector.log` - Port weather collection logs
- `logs/all-collectors.log` - Combined collector logs

### Server Logs
- Console output (can be redirected to file)
- PM2 logs (if using PM2)

## Build Artifacts

### Not Tracked in Git
- `node_modules/` - NPM dependencies
- `.env` - Environment variables
- `logs/` - Log files
- `.cache/` - Cache directory

### Tracked in Git
- All source code
- Documentation
- Configuration templates
- Scripts

---

**Note**: This structure follows Node.js best practices and separates concerns for maintainability and scalability.
