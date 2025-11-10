import cron from 'node-cron';
import { CampaignModel } from '../models/Campaign.model';
import { CampaignMetricsModel } from '../models/Analytics.model';
import Questionnaire from '../models/Questionnaire.model';
import MetaApiService from '../services/MetaApiService';
import logger from '../utils/logger';

/**
 * Sync campaign data from Meta API
 */
export const dataSyncJob = cron.schedule(
  process.env.DATA_SYNC_INTERVAL || '*/15 * * * *', // Every 15 minutes
  async () => {
    try {
      logger.info('Starting data sync job...');

      // Get all active campaigns
      const campaigns = await CampaignModel.find({
        status: { $in: ['ACTIVE', 'PAUSED'] },
      });

      logger.info(`Found ${campaigns.length} campaigns to sync`);

      for (const campaign of campaigns) {
        try {
          // Get questionnaire for credentials
          const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
          if (!questionnaire) {
            logger.warn(`Questionnaire not found for campaign: ${campaign._id}`);
            continue;
          }

          // Initialize Meta API
          const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);

          // Get insights from Meta
          const insights = await metaApi.getCampaignInsights(
            campaign.metaCampaignId!,
            [
              'impressions',
              'clicks',
              'spend',
              'reach',
              'frequency',
              'ctr',
              'cpc',
              'cpm',
              'cpp',
              'actions',
              'action_values',
            ],
            'last_7d'
          );

          // Calculate conversions and ROAS
          let conversions = 0;
          let revenue = 0;

          if (insights.actions) {
            const conversionActions = insights.actions.filter(
              (action: any) => action.action_type === 'purchase' || action.action_type === 'lead'
            );
            conversions = conversionActions.reduce(
              (sum: number, action: any) => sum + parseInt(action.value || '0'),
              0
            );
          }

          if (insights.action_values) {
            const purchaseValues = insights.action_values.filter(
              (action: any) => action.action_type === 'purchase'
            );
            revenue = purchaseValues.reduce(
              (sum: number, action: any) => sum + parseFloat(action.value || '0'),
              0
            );
          }

          const spend = parseFloat(insights.spend || '0');
          const roas = spend > 0 ? revenue / spend : 0;
          const costPerConversion = conversions > 0 ? spend / conversions : 0;

          // Update or create metrics
          const metrics = {
            campaignId: campaign._id,
            metaCampaignId: campaign.metaCampaignId!,
            dateStart: insights.date_start || new Date().toISOString().split('T')[0],
            dateStop: insights.date_stop || new Date().toISOString().split('T')[0],
            impressions: parseInt(insights.impressions || '0'),
            clicks: parseInt(insights.clicks || '0'),
            spend,
            reach: parseInt(insights.reach || '0'),
            frequency: parseFloat(insights.frequency || '0'),
            ctr: parseFloat(insights.ctr || '0'),
            cpc: parseFloat(insights.cpc || '0'),
            cpm: parseFloat(insights.cpm || '0'),
            cpp: parseFloat(insights.cpp || '0'),
            conversions,
            costPerConversion,
            roas,
            revenue,
            updatedAt: new Date(),
          };

          await CampaignMetricsModel.findOneAndUpdate(
            { campaignId: campaign._id },
            metrics,
            { upsert: true, new: true }
          );

          logger.info(`Synced metrics for campaign: ${campaign._id}`);
        } catch (error: any) {
          logger.error(`Error syncing campaign ${campaign._id}:`, error.message);
        }
      }

      logger.info('Data sync job completed');
    } catch (error: any) {
      logger.error('Data sync job error:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
  }
);

export default dataSyncJob;
