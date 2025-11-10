import dataSyncJob from './dataSyncJob';
import optimizationJob from './optimizationJob';
import logger from '../utils/logger';

export const startCronJobs = (): void => {
  logger.info('Starting cron jobs...');

  // Start data sync job
  dataSyncJob.start();
  logger.info('Data sync job started');

  // Start optimization job
  if (process.env.AUTO_OPTIMIZATION_ENABLED === 'true') {
    optimizationJob.start();
    logger.info('Auto-optimization job started');
  }
};

export const stopCronJobs = (): void => {
  logger.info('Stopping cron jobs...');

  dataSyncJob.stop();
  optimizationJob.stop();

  logger.info('Cron jobs stopped');
};
