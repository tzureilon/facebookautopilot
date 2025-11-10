import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
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

export class AnalyticsController {
  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;

      const campaign = await CampaignModel.findOne({ _id: campaignId, userId });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const metrics = await CampaignMetricsModel.findOne({ campaignId: campaign._id })
        .sort({ createdAt: -1 });

      res.json(metrics || {});
    } catch (error: any) {
      logger.error('Get campaign analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get all campaigns
      const campaigns = await CampaignModel.find({ userId, status: { $ne: 'DELETED' } });

      if (campaigns.length === 0) {
        res.json({
          summary: {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
            averageCTR: 0,
            averageCPC: 0,
            averageROAS: 0,
          },
          campaigns: [],
          recentAlerts: [],
          recentActions: [],
          chartData: { labels: [], datasets: [] },
        });
        return;
      }

      // Get metrics for all campaigns
      const campaignIds = campaigns.map(c => c._id);
      const allMetrics = await CampaignMetricsModel.find({
        campaignId: { $in: campaignIds },
      }).sort({ createdAt: -1 });

      // Calculate summary
      const summary = {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageROAS: 0,
      };

      allMetrics.forEach(metrics => {
        summary.totalSpend += metrics.spend;
        summary.totalImpressions += metrics.impressions;
        summary.totalClicks += metrics.clicks;
        summary.totalConversions += metrics.conversions || 0;
      });

      if (summary.totalImpressions > 0) {
        summary.averageCTR = (summary.totalClicks / summary.totalImpressions) * 100;
      }

      if (summary.totalClicks > 0) {
        summary.averageCPC = summary.totalSpend / summary.totalClicks;
      }

      if (allMetrics.length > 0) {
        const roasValues = allMetrics.filter(m => m.roas).map(m => m.roas!);
        if (roasValues.length > 0) {
          summary.averageROAS = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
        }
      }

      // Get recent alerts
      const recentAlerts = await PerformanceAlertModel.find({
        campaignId: { $in: campaignIds },
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Get recent actions
      const recentActions = await OptimizationActionModel.find({
        campaignId: { $in: campaignIds },
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Generate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartData = {
        labels: last7Days,
        datasets: [
          {
            label: 'Spend',
            data: last7Days.map(() => Math.random() * 100), // TODO: Get real data
          },
          {
            label: 'Clicks',
            data: last7Days.map(() => Math.random() * 500), // TODO: Get real data
          },
        ],
      };

      res.json({
        summary,
        campaigns: allMetrics,
        recentAlerts,
        recentActions,
        chartData,
      });
    } catch (error: any) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Sync metrics from Meta
   */
  async syncMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;

      const campaign = await CampaignModel.findOne({ _id: campaignId, userId });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Get credentials
      const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      // Initialize Meta API
      const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);

      // Get insights from Meta
      const insights = await metaApi.getCampaignInsights(campaign.metaCampaignId!);

      // Calculate metrics
      const metrics = {
        campaignId: campaign._id,
        metaCampaignId: campaign.metaCampaignId!,
        dateStart: insights.date_start || new Date().toISOString().split('T')[0],
        dateStop: insights.date_stop || new Date().toISOString().split('T')[0],
        impressions: parseInt(insights.impressions || '0'),
        clicks: parseInt(insights.clicks || '0'),
        spend: parseFloat(insights.spend || '0'),
        reach: parseInt(insights.reach || '0'),
        frequency: parseFloat(insights.frequency || '0'),
        ctr: parseFloat(insights.ctr || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0'),
        cpp: parseFloat(insights.cpp || '0'),
        conversions: parseInt(insights.conversions || '0'),
        updatedAt: new Date(),
      };

      // Update or create metrics
      await CampaignMetricsModel.findOneAndUpdate(
        { campaignId: campaign._id },
        metrics,
        { upsert: true, new: true }
      );

      logger.info(`Metrics synced for campaign: ${campaignId}`);

      res.json(metrics);
    } catch (error: any) {
      logger.error('Sync metrics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get performance alerts
   */
  async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const campaigns = await CampaignModel.find({ userId });
      const campaignIds = campaigns.map(c => c._id);

      const alerts = await PerformanceAlertModel.find({
        campaignId: { $in: campaignIds },
        acknowledged: false,
      }).sort({ createdAt: -1 });

      res.json(alerts);
    } catch (error: any) {
      logger.error('Get alerts error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;

      const alert = await PerformanceAlertModel.findByIdAndUpdate(
        alertId,
        { acknowledged: true },
        { new: true }
      );

      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      res.json(alert);
    } catch (error: any) {
      logger.error('Acknowledge alert error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get optimization actions
   */
  async getActions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const campaigns = await CampaignModel.find({ userId });
      const campaignIds = campaigns.map(c => c._id);

      const actions = await OptimizationActionModel.find({
        campaignId: { $in: campaignIds },
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json(actions);
    } catch (error: any) {
      logger.error('Get actions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AnalyticsController();
