#!/bin/bash

# Weather Map Setup Script
# This script sets up the Weather Map application

set -e

echo "================================"
echo "Weather Map Setup Script"
echo "================================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required"
    echo "   Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 9 ]; then
    echo "❌ npm version 9 or higher is required"
    echo "   Current version: $(npm -v)"
    exit 1
fi
echo "✅ npm version: $(npm -v)"

# Check MongoDB
echo "Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB client (mongosh) is installed"
elif command -v mongo &> /dev/null; then
    echo "✅ MongoDB client (mongo) is installed"
else
    echo "⚠️  MongoDB client not found. Make sure MongoDB is installed and running."
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo ""
    echo "✅ .env file already exists"
fi

# Create logs directory
echo ""
echo "Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory created"

# Test MongoDB connection
echo ""
echo "Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = \`\${process.env.MONGO_URI || 'mongodb://localhost:27017'}/\${process.env.MONGO_DB || 'weather_map'}\`;

mongoose.connect(mongoUri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 
})
.then(() => {
  console.log('✅ MongoDB connection successful');
  process.exit(0);
})
.catch((err) => {
  console.log('❌ MongoDB connection failed:', err.message);
  console.log('   Please make sure MongoDB is running');
  process.exit(1);
});
" || echo "⚠️  Could not test MongoDB connection. Please verify manually."

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the server: npm start"
echo "3. Collect weather data: npm run collect:all"
echo ""
echo "For more information, see README.md"
echo ""
