import mongoose from 'mongoose';
import config from '../config/config.js';

let isConnected = false;

/**
 * Connect to MongoDB
 */
export async function connectDatabase() {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  try {
    const mongoUri = `${config.mongodb.uri}/${config.mongodb.dbName}`;
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${config.mongodb.dbName}`);
    console.log(`   URI: ${config.mongodb.uri}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('👋 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isConnected: isDatabaseConnected
};
