import { connectDatabase, disconnectDatabase } from './database.js';
import { cleanupOldHistory } from './weatherRepository.js';
import { logWithTimestamp } from './helpers.js';

/**
 * Cleanup Old Historical Weather Data
 * Removes historical data older than specified days
 */

const DEFAULT_DAYS_TO_KEEP = 90; // Keep 90 days of history by default

async function main() {
  const daysToKeep = parseInt(process.argv[2]) || DEFAULT_DAYS_TO_KEEP;
  
  logWithTimestamp('Historical Data Cleanup Utility', 'info');
  logWithTimestamp('='.repeat(50), 'info');
  logWithTimestamp(`Retention policy: Keep last ${daysToKeep} days`, 'info');
  logWithTimestamp('', 'info');

  try {
    // Connect to database
    await connectDatabase();
    logWithTimestamp('Connected to MongoDB', 'info');

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    logWithTimestamp(`Deleting records older than: ${cutoffDate.toISOString()}`, 'info');
    logWithTimestamp('', 'info');

    // Perform cleanup
    logWithTimestamp('Starting cleanup...', 'info');
    const result = await cleanupOldHistory(daysToKeep);

    // Display results
    logWithTimestamp('='.repeat(50), 'info');
    logWithTimestamp('Cleanup Results:', 'info');
    logWithTimestamp('='.repeat(50), 'info');
    logWithTimestamp(`City weather history deleted: ${result.city}`, 'info');
    logWithTimestamp(`Grid weather history deleted: ${result.grid}`, 'info');
    logWithTimestamp(`Port weather history deleted: ${result.port}`, 'info');
    logWithTimestamp(`Total records deleted: ${result.total}`, 'info');
    logWithTimestamp('='.repeat(50), 'info');

    if (result.total > 0) {
      logWithTimestamp(`✅ Successfully cleaned up ${result.total} old records`, 'info');
    } else {
      logWithTimestamp('ℹ️  No old records found to delete', 'info');
    }

    // Disconnect
    await disconnectDatabase();
    return 0;

  } catch (error) {
    logWithTimestamp(`❌ Error during cleanup: ${error.message}`, 'error');
    console.error(error);
    
    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    return 1;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main;
