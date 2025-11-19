import mongoose from 'mongoose';

// City Metadata Schema
const cityMetadataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  admin1: String,
  admin2: String,
  country: String,
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: process.env.CITY_METADATA_COLLECTION || 'city_metadata',
  timestamps: false
});

// Grid Metadata Schema
const gridMetadataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: process.env.GRID_METADATA_COLLECTION || 'grid_metadata',
  timestamps: false
});

// Port Metadata Schema
const portMetadataSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  port_name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: process.env.PORT_METADATA_COLLECTION || 'port_metadata',
  timestamps: false
});

export const CityMetadata = mongoose.model('CityMetadata', cityMetadataSchema);
export const GridMetadata = mongoose.model('GridMetadata', gridMetadataSchema);
export const PortMetadata = mongoose.model('PortMetadata', portMetadataSchema);
