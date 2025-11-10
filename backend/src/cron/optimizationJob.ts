import cron from 'node-cron';
import { CampaignModel, AdSetModel, AdModel } from '../models/Campaign.model';
import {
  CampaignMetricsModel,
  AdSetMetricsModel,
  AdMetricsModel,
  PerformanceAlertModel,
  OptimizationActionModel,
} from '../models/Analytics.model';
import Questionnaire from '../models/Questionnaire.model';
import MetaApiService from '../services/MetaApiService';
import logger from '../utils/logger';

/**
 * Auto-optimization job for campaigns
 */
export const optimizationJob = cron.schedule(
  process.env.AUTO_OPTIMIZATION_INTERVAL || '*/30 * * * *', // Every 30 minutes
  async () => {
    try {
      if (process.env.AUTO_OPTIMIZATION_ENABLED !== 'true') {
        return;
      }

      logger.info('Starting auto-optimization job...');

      // Performance thresholds
      const LOW_CTR_THRESHOLD = parseFloat(process.env.LOW_CTR_THRESHOLD || '0.5');
      const HIGH_CPC_THRESHOLD = parseFloat(process.env.HIGH_CPC_THRESHOLD || '2.0');
      const LOW_ROAS_THRESHOLD = parseFloat(process.env.LOW_ROAS_THRESHOLD || '1.5');

      // Get all active campaigns
      const campaigns = await CampaignModel.find({ status: 'ACTIVE' });

      logger.info(`Found ${campaigns.length} active campaigns to optimize`);

      for (const campaign of campaigns) {
        try {
          // Get campaign metrics
          const metrics = await CampaignMetricsModel.findOne({ campaignId: campaign._id });
          if (!metrics) continue;

          // Get questionnaire for credentials
          const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
          if (!questionnaire) continue;

          const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);

          // Check for low CTR
          if (metrics.ctr < LOW_CTR_THRESHOLD && metrics.impressions > 1000) {
            await this.createAlert(
              campaign._id,
              'LOW_CTR',
              'warning',
              `Campaign CTR (${metrics.ctr.toFixed(2)}%) is below threshold (${LOW_CTR_THRESHOLD}%)`,
              LOW_CTR_THRESHOLD,
              metrics.ctr
            );
          }

          // Check for high CPC
          if (metrics.cpc > HIGH_CPC_THRESHOLD && metrics.clicks > 100) {
            await this.createAlert(
              campaign._id,
              'HIGH_CPC',
              'warning',
              `Campaign CPC ($${metrics.cpc.toFixed(2)}) is above threshold ($${HIGH_CPC_THRESHOLD})`,
              HIGH_CPC_THRESHOLD,
              metrics.cpc
            );
          }

          // Check for low ROAS
          if (metrics.roas && metrics.roas < LOW_ROAS_THRESHOLD && metrics.conversions && metrics.conversions > 5) {
            await this.createAlert(
              campaign._id,
              'LOW_ROAS',
              'critical',
              `Campaign ROAS (${metrics.roas.toFixed(2)}) is below threshold (${LOW_ROAS_THRESHOLD})`,
              LOW_ROAS_THRESHOLD,
              metrics.roas
            );
          }

          // Optimize ad sets
          const adSets = await AdSetModel.find({ campaignId: campaign._id, status: 'ACTIVE' });

          for (const adSet of adSets) {
            const adSetMetrics = await AdSetMetricsModel.findOne({ adSetId: adSet._id });
            if (!adSetMetrics) continue;

            // Pause poorly performing ad sets
            if (
              adSetMetrics.ctr < LOW_CTR_THRESHOLD / 2 &&
              adSetMetrics.impressions > 500 &&
              adSetMetrics.spend > 20
            ) {
              try {
                await metaApi.updateAdSetStatus(adSet.metaAdSetId!, 'PAUSED');
                adSet.status = 'PAUSED';
                await adSet.save();

                await this.createAction(
                  campaign._id,
                  adSet._id,
                  undefined,
                  'PAUSE',
                  `AdSet paused due to low CTR (${adSetMetrics.ctr.toFixed(2)}%)`,
                  'ACTIVE',
                  'PAUSED'
                );

                logger.info(`Paused ad set ${adSet._id} due to low performance`);
              } catch (error) {
                logger.error(`Failed to pause ad set ${adSet._id}:`, error);
              }
            }

            // Scale winning ad sets
            if (
              adSetMetrics.roas &&
              adSetMetrics.roas > LOW_ROAS_THRESHOLD * 2 &&
              adSetMetrics.conversions &&
              adSetMetrics.conversions > 10
            ) {
              try {
                const newBudget = Math.floor(adSet.dailyBudget! * 1.2); // Increase by 20%
                await metaApi.updateAdSetBudget(adSet.metaAdSetId!, newBudget);

                const oldBudget = adSet.dailyBudget;
                adSet.dailyBudget = newBudget;
                await adSet.save();

                await this.createAction(
                  campaign._id,
                  adSet._id,
                  undefined,
                  'INCREASE_BUDGET',
                  `AdSet budget increased due to high ROAS (${adSetMetrics.roas.toFixed(2)})`,
                  oldBudget,
                  newBudget
                );

                logger.info(`Increased budget for ad set ${adSet._id}`);
              } catch (error) {
                logger.error(`Failed to increase budget for ad set ${adSet._id}:`, error);
              }
            }
          }

          // Optimize ads
          const ads = await AdModel.find({
            adSetId: { $in: adSets.map(as => as._id) },
            status: 'ACTIVE',
          });

          for (const ad of ads) {
            const adMetrics = await AdMetricsModel.findOne({ adId: ad._id });
            if (!adMetrics) continue;

            // Pause poorly performing ads
            if (
              adMetrics.ctr < LOW_CTR_THRESHOLD / 3 &&
              adMetrics.impressions > 300 &&
              adMetrics.spend > 10
            ) {
              try {
                await metaApi.updateAdStatus(ad.metaAdId!, 'PAUSED');
                ad.status = 'PAUSED';
                await ad.save();

                await this.createAction(
                  campaign._id,
                  undefined,
                  ad._id,
                  'PAUSE',
                  `Ad paused due to low CTR (${adMetrics.ctr.toFixed(2)}%)`,
                  'ACTIVE',
                  'PAUSED'
                );

                logger.info(`Paused ad ${ad._id} due to low performance`);
              } catch (error) {
                logger.error(`Failed to pause ad ${ad._id}:`, error);
              }
            }
          }
        } catch (error: any) {
          logger.error(`Error optimizing campaign ${campaign._id}:`, error.message);
        }
      }

      logger.info('Auto-optimization job completed');
    } catch (error: any) {
      logger.error('Auto-optimization job error:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
  }
);

// Helper function to create alerts
async function createAlert(
  campaignId: any,
  type: any,
  severity: any,
  message: string,
  threshold: number,
  currentValue: number
): Promise<void> {
  try {
    // Check if alert already exists
    const existingAlert = await PerformanceAlertModel.findOne({
      campaignId,
      type,
      acknowledged: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (!existingAlert) {
      await PerformanceAlertModel.create({
        campaignId,
        type,
        severity,
        message,
        threshold,
        currentValue,
        acknowledged: false,
      });
    }
  } catch (error) {
    logger.error('Error creating alert:', error);
  }
}

// Helper function to create optimization actions
async function createAction(
  campaignId: any,
  adSetId: any,
  adId: any,
  action: any,
  reason: string,
  previousValue: any,
  newValue: any
): Promise<void> {
  try {
    await OptimizationActionModel.create({
      campaignId,
      adSetId,
      adId,
      action,
      reason,
      previousValue,
      newValue,
      status: 'applied',
      appliedAt: new Date(),
    });
  } catch (error) {
    logger.error('Error creating action:', error);
  }
}

export default optimizationJob;
