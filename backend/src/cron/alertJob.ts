import cron from 'node-cron';
import AlertRulesEngine from '../services/AlertRulesEngine';
import logger from '../utils/logger';

/**
 * Alert rules evaluation job
 */
export const alertJob = cron.schedule(
  '*/10 * * * *', // Every 10 minutes
  async () => {
    try {
      logger.info('Starting alert rules evaluation job...');

      // Evaluate all active alert rules
      await AlertRulesEngine.evaluateAllRules();

      logger.info('Alert rules evaluation job completed');
    } catch (error: any) {
      logger.error('Alert rules evaluation job error:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
  }
);

/**
 * Anomaly detection job
 */
export const anomalyDetectionJob = cron.schedule(
  '0 */6 * * *', // Every 6 hours
  async () => {
    try {
      logger.info('Starting anomaly detection job...');

      // This would detect anomalies for all users
      // For now, it's called on-demand via API

      logger.info('Anomaly detection job completed');
    } catch (error: any) {
      logger.error('Anomaly detection job error:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
  }
);

export { alertJob as default, anomalyDetectionJob };
