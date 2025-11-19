/**
 * Utility helper functions
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a slug from a string
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
export function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Parse ISO datetime string to Date object
 * @param {string} value - ISO datetime string
 * @returns {Date|null} Date object or null
 */
export function parseISODateTime(value) {
  if (!value) return null;
  
  try {
    return new Date(value);
  } catch (error) {
    return null;
  }
}

/**
 * Calculate hours since a given date
 * @param {Date} date - Date to calculate from
 * @returns {number|null} Hours since date or null
 */
export function hoursSince(date) {
  if (!date) return null;
  
  const now = new Date();
  const diffMs = now - date;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Check if data is fresh based on max age
 * @param {Date} fetchedAt - Date when data was fetched
 * @param {number} maxAgeHours - Maximum age in hours
 * @returns {boolean} True if data is fresh
 */
export function isDataFresh(fetchedAt, maxAgeHours) {
  if (!fetchedAt) return false;
  
  const age = hoursSince(fetchedAt);
  return age !== null && age <= maxAgeHours;
}

/**
 * Batch an array into smaller chunks
 * @param {Array} array - Array to batch
 * @param {number} size - Batch size
 * @returns {Array<Array>} Array of batches
 */
export function batchArray(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Log with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
export function logWithTimestamp(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗'
  }[level] || 'ℹ';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

export default {
  sleep,
  createSlug,
  parseISODateTime,
  hoursSince,
  isDataFresh,
  batchArray,
  retryWithBackoff,
  formatBytes,
  logWithTimestamp
};
