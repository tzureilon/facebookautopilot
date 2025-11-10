import dataSyncJob from './dataSyncJob';
import optimizationJob from './optimizationJob';
import abtestJob from './abtestJob';
import alertJob, { anomalyDetectionJob } from './alertJob';
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

  // Start A/B test monitoring job
  abtestJob.start();
  logger.info('A/B test monitoring job started');

  // Start alert rules evaluation job
  alertJob.start();
  logger.info('Alert rules evaluation job started');

  // Start anomaly detection job
  anomalyDetectionJob.start();
  logger.info('Anomaly detection job started');
};

export const stopCronJobs = (): void => {
  logger.info('Stopping cron jobs...');

  dataSyncJob.stop();
  optimizationJob.stop();
  abtestJob.stop();
  alertJob.stop();
  anomalyDetectionJob.stop();

  logger.info('Cron jobs stopped');
};
