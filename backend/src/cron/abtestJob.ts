import cron from 'node-cron';
import { ABTestModel } from '../models/ABTest.model';
import ABTestingService from '../services/ABTestingService';
import logger from '../utils/logger';

/**
 * A/B Test monitoring and optimization job
 */
export const abtestJob = cron.schedule(
  '*/20 * * * *', // Every 20 minutes
  async () => {
    try {
      logger.info('Starting A/B test monitoring job...');

      // Get all running tests
      const runningTests = await ABTestModel.find({ status: 'running' });

      logger.info(`Found ${runningTests.length} running A/B tests`);

      for (const test of runningTests) {
        try {
          // Update metrics for the test
          await ABTestingService.updateTestMetrics(test._id.toString());

          // Check if test has a winner (if auto-winner is enabled)
          if (test.autoWinnerEnabled) {
            const hasWinner = await ABTestingService.checkAndDeclareWinner(test._id.toString());

            if (hasWinner) {
              logger.info(`Winner declared for test: ${test.name}`);

              // TODO: Send notification to user about winner
              // This would integrate with NotificationService
            }
          }

          // Check if test duration has expired
          if (test.endDate && new Date() > test.endDate) {
            test.status = 'completed';
            await test.save();
            logger.info(`Test completed (duration expired): ${test.name}`);
          }

          // Ensure at least one ad is active in each variant
          for (const variant of test.variants) {
            if (variant.status === 'active' && variant.adIds.length === 0) {
              logger.warn(`Variant ${variant.name} has no ads - test may not be collecting data`);
            }
          }
        } catch (error: any) {
          logger.error(`Error processing A/B test ${test._id}:`, error.message);
        }
      }

      logger.info('A/B test monitoring job completed');
    } catch (error: any) {
      logger.error('A/B test monitoring job error:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
  }
);

export default abtestJob;
