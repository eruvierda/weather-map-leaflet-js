import { fileURLToPath } from 'url';
import { connectDatabase, disconnectDatabase } from '../utils/database.js';
import { logWithTimestamp, retryWithBackoff } from '../utils/helpers.js';
import cityWeatherCollector from './cityWeatherCollector.js';
import gridWeatherCollector from './gridWeatherCollector.js';
import portWeatherCollector from './portWeatherCollector.js';

/**
 * Orchestrator to run all weather data collectors
 */

const COLLECTORS = [
  { name: 'City Weather', fn: cityWeatherCollector },
  { name: 'Grid Weather', fn: gridWeatherCollector },
  { name: 'Port Weather', fn: portWeatherCollector }
];

/**
 * Run a collector with retry logic
 */
async function runCollectorWithRetry(collector, maxRetries = 3) {
  logWithTimestamp(`[${collector.name}] Starting...`, 'info');
  
  try {
    await retryWithBackoff(
      async () => {
        const exitCode = await collector.fn();
        if (exitCode !== 0) {
          throw new Error(`Collector returned exit code ${exitCode}`);
        }
      },
      maxRetries,
      5000 // 5 second base delay
    );
    
    logWithTimestamp(`[${collector.name}] ✅ Success`, 'info');
    return true;
  } catch (error) {
    logWithTimestamp(`[${collector.name}] ❌ Failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Main orchestrator function
 */
async function main() {
  const startTime = Date.now();
  
  logWithTimestamp('='.repeat(60), 'info');
  logWithTimestamp('🚀 Weather Data Collection Orchestrator started', 'info');
  logWithTimestamp(`Started at: ${new Date().toISOString()}`, 'info');
  logWithTimestamp('='.repeat(60), 'info');

  try {
    // Connect to database once for all collectors
    await connectDatabase();

    const results = [];

    // Run each collector sequentially
    for (const collector of COLLECTORS) {
      logWithTimestamp(`\n--- Running ${collector.name} ---`, 'info');
      const success = await runCollectorWithRetry(collector);
      results.push({ name: collector.name, success });
      
      // Add a small delay between collectors
      if (collector !== COLLECTORS[COLLECTORS.length - 1]) {
        logWithTimestamp('Waiting 5 seconds before next collector...', 'info');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Summary
    logWithTimestamp('\n' + '='.repeat(60), 'info');
    logWithTimestamp('--- Summary ---', 'info');
    logWithTimestamp('='.repeat(60), 'info');
    
    for (const result of results) {
      const status = result.success ? '✅ Success' : '❌ Failed';
      logWithTimestamp(`${result.name}: ${status}`, 'info');
    }

    const duration = (Date.now() - startTime) / 1000;
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    logWithTimestamp('='.repeat(60), 'info');
    logWithTimestamp(`Orchestrator finished in ${duration.toFixed(1)} seconds`, 'info');
    logWithTimestamp(`Success rate: ${successCount}/${totalCount} (${(successCount / totalCount * 100).toFixed(1)}%)`, 'info');
    logWithTimestamp('='.repeat(60), 'info');

    // Disconnect from database
    await disconnectDatabase();

    return successCount === totalCount ? 0 : 1;

  } catch (error) {
    logWithTimestamp(`Fatal error in orchestrator: ${error.message}`, 'error');
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
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('runAllCollectors.js')
);

if (isMainModule) {
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
