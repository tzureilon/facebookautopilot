import { AlertRuleModel, AlertNotificationModel } from '../models/Alert.model';
import { CampaignMetricsModel, AdSetMetricsModel, AdMetricsModel } from '../models/Analytics.model';
import { CampaignModel, AdSetModel, AdModel } from '../models/Campaign.model';
import Questionnaire from '../models/Questionnaire.model';
import MetaApiService from './MetaApiService';
import NotificationService from './NotificationService';
import logger from '../utils/logger';

export class AlertRulesEngine {
  /**
   * Evaluate all active alert rules
   */
  async evaluateAllRules(): Promise<void> {
    try {
      logger.info('Evaluating alert rules...');

      const rules = await AlertRuleModel.find({ enabled: true });

      for (const rule of rules) {
        try {
          await this.evaluateRule(rule);
        } catch (error: any) {
          logger.error(`Error evaluating rule ${rule._id}:`, error.message);
        }
      }

      logger.info(`Evaluated ${rules.length} alert rules`);
    } catch (error: any) {
      logger.error('Error evaluating alert rules:', error);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  async evaluateRule(rule: any): Promise<void> {
    // Check cooldown period
    if (rule.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < rule.cooldownPeriod * 60 * 1000) {
        return; // Still in cooldown
      }
    }

    // Get entities to check
    const entities = await this.getEntitiesForRule(rule);

    for (const entity of entities) {
      const metrics = await this.getMetricsForEntity(rule.entity, entity.id);
      if (!metrics) continue;

      const currentValue = metrics[rule.metric];
      if (currentValue === undefined) continue;

      const shouldTrigger = this.evaluateCondition(
        currentValue,
        rule.operator,
        rule.threshold
      );

      if (shouldTrigger) {
        await this.triggerAlert(rule, entity, currentValue);
      }
    }
  }

  /**
   * Get entities for a rule
   */
  private async getEntitiesForRule(rule: any): Promise<Array<{ id: string; name: string }>> {
    if (rule.entityIds && rule.entityIds.length > 0) {
      // Specific entities
      return this.getSpecificEntities(rule.entity, rule.entityIds);
    } else {
      // All entities for user
      return this.getAllEntitiesForUser(rule.entity, rule.userId);
    }
  }

  /**
   * Get specific entities
   */
  private async getSpecificEntities(
    entityType: string,
    entityIds: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    switch (entityType) {
      case 'campaign':
        const campaigns = await CampaignModel.find({ _id: { $in: entityIds } });
        return campaigns.map(c => ({ id: c._id.toString(), name: c.name }));

      case 'adset':
        const adSets = await AdSetModel.find({ _id: { $in: entityIds } });
        return adSets.map(a => ({ id: a._id.toString(), name: a.name }));

      case 'ad':
        const ads = await AdModel.find({ _id: { $in: entityIds } });
        return ads.map(a => ({ id: a._id.toString(), name: a.name }));

      default:
        return [];
    }
  }

  /**
   * Get all entities for a user
   */
  private async getAllEntitiesForUser(
    entityType: string,
    userId: string
  ): Promise<Array<{ id: string; name: string }>> {
    switch (entityType) {
      case 'campaign':
        const campaigns = await CampaignModel.find({ userId, status: { $ne: 'DELETED' } });
        return campaigns.map(c => ({ id: c._id.toString(), name: c.name }));

      case 'adset':
        const userCampaigns = await CampaignModel.find({ userId });
        const campaignIds = userCampaigns.map(c => c._id);
        const adSets = await AdSetModel.find({
          campaignId: { $in: campaignIds },
          status: { $ne: 'DELETED' },
        });
        return adSets.map(a => ({ id: a._id.toString(), name: a.name }));

      case 'ad':
        const allCampaigns = await CampaignModel.find({ userId });
        const allCampaignIds = allCampaigns.map(c => c._id);
        const allAdSets = await AdSetModel.find({ campaignId: { $in: allCampaignIds } });
        const adSetIds = allAdSets.map(a => a._id);
        const ads = await AdModel.find({
          adSetId: { $in: adSetIds },
          status: { $ne: 'DELETED' },
        });
        return ads.map(a => ({ id: a._id.toString(), name: a.name }));

      default:
        return [];
    }
  }

  /**
   * Get metrics for an entity
   */
  private async getMetricsForEntity(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'campaign':
        return CampaignMetricsModel.findOne({ campaignId: entityId });

      case 'adset':
        return AdSetMetricsModel.findOne({ adSetId: entityId });

      case 'ad':
        return AdMetricsModel.findOne({ adId: entityId });

      default:
        return null;
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(
    currentValue: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'greater_than':
        return currentValue > threshold;

      case 'less_than':
        return currentValue < threshold;

      case 'equals':
        return Math.abs(currentValue - threshold) < 0.01;

      case 'changes_by':
      case 'drops_by':
      case 'increases_by':
        // These would require historical data comparison
        // For now, treat as greater_than
        return currentValue > threshold;

      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    rule: any,
    entity: { id: string; name: string },
    currentValue: number
  ): Promise<void> {
    try {
      // Determine severity
      const severity = this.determineSeverity(rule.priority, currentValue, rule.threshold);

      // Create alert notification
      const notification = await AlertNotificationModel.create({
        alertRuleId: rule._id,
        userId: rule.userId,
        severity,
        title: rule.name,
        message: this.formatAlertMessage(rule, entity, currentValue),
        entityType: rule.entity,
        entityId: entity.id,
        entityName: entity.name,
        metric: rule.metric,
        currentValue,
        threshold: rule.threshold,
        status: 'unread',
        actionsTaken: [],
      });

      // Execute actions
      await this.executeActions(rule, entity, notification);

      // Send notifications
      await NotificationService.sendNotification(
        rule.userId,
        notification.toObject(),
        rule.notificationChannels
      );

      // Update rule
      rule.lastTriggered = new Date();
      rule.triggerCount++;
      await rule.save();

      logger.info(`Alert triggered: ${rule.name} for ${entity.name}`);
    } catch (error: any) {
      logger.error('Error triggering alert:', error);
    }
  }

  /**
   * Determine severity based on priority and threshold violation
   */
  private determineSeverity(
    priority: string,
    currentValue: number,
    threshold: number
  ): 'info' | 'warning' | 'error' | 'critical' {
    const deviation = Math.abs(currentValue - threshold) / threshold;

    if (priority === 'critical' || deviation > 0.5) {
      return 'critical';
    } else if (priority === 'high' || deviation > 0.3) {
      return 'error';
    } else if (priority === 'medium' || deviation > 0.1) {
      return 'warning';
    } else {
      return 'info';
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(rule: any, entity: { name: string }, currentValue: number): string {
    const metricName = rule.metric.toUpperCase().replace('_', ' ');
    const operatorText = this.getOperatorText(rule.operator);

    return `${entity.name}: ${metricName} is ${currentValue.toFixed(2)}, which is ${operatorText} the threshold of ${rule.threshold.toFixed(2)}`;
  }

  /**
   * Get operator text
   */
  private getOperatorText(operator: string): string {
    switch (operator) {
      case 'greater_than':
        return 'greater than';
      case 'less_than':
        return 'less than';
      case 'equals':
        return 'equal to';
      case 'changes_by':
        return 'changed by more than';
      case 'drops_by':
        return 'dropped by more than';
      case 'increases_by':
        return 'increased by more than';
      default:
        return 'compared to';
    }
  }

  /**
   * Execute alert actions
   */
  private async executeActions(rule: any, entity: { id: string; name: string }, notification: any): Promise<void> {
    for (const action of rule.actions) {
      try {
        let actionResult = {
          action: action.type,
          status: 'pending' as 'pending' | 'success' | 'failed',
          timestamp: new Date(),
          error: undefined as string | undefined,
        };

        switch (action.type) {
          case 'notify':
            // Already handled by sendNotification
            actionResult.status = 'success';
            break;

          case 'pause_campaign':
            if (rule.entity === 'campaign') {
              await this.pauseCampaign(entity.id);
              actionResult.status = 'success';
            }
            break;

          case 'pause_adset':
            if (rule.entity === 'adset') {
              await this.pauseAdSet(entity.id);
              actionResult.status = 'success';
            }
            break;

          case 'pause_ad':
            if (rule.entity === 'ad') {
              await this.pauseAd(entity.id);
              actionResult.status = 'success';
            }
            break;

          case 'adjust_budget':
            if (rule.entity === 'adset' && action.config.budgetAdjustment) {
              await this.adjustBudget(entity.id, action.config.budgetAdjustment);
              actionResult.status = 'success';
            }
            break;

          case 'send_webhook':
            if (action.config.webhookUrl) {
              await this.sendWebhook(action.config.webhookUrl, {
                alert: notification.toObject(),
                entity,
              });
              actionResult.status = 'success';
            }
            break;
        }

        notification.actionsTaken.push(actionResult);
      } catch (error: any) {
        logger.error(`Error executing action ${action.type}:`, error.message);
        notification.actionsTaken.push({
          action: action.type,
          status: 'failed',
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    await notification.save();
  }

  /**
   * Pause a campaign
   */
  private async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = await CampaignModel.findById(campaignId);
    if (!campaign) return;

    const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
    if (!questionnaire) return;

    const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
    await metaApi.updateCampaignStatus(campaign.metaCampaignId!, 'PAUSED');

    campaign.status = 'PAUSED';
    await campaign.save();
  }

  /**
   * Pause an ad set
   */
  private async pauseAdSet(adSetId: string): Promise<void> {
    const adSet = await AdSetModel.findById(adSetId);
    if (!adSet) return;

    const campaign = await CampaignModel.findById(adSet.campaignId);
    if (!campaign) return;

    const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
    if (!questionnaire) return;

    const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
    await metaApi.updateAdSetStatus(adSet.metaAdSetId!, 'PAUSED');

    adSet.status = 'PAUSED';
    await adSet.save();
  }

  /**
   * Pause an ad
   */
  private async pauseAd(adId: string): Promise<void> {
    const ad = await AdModel.findById(adId);
    if (!ad) return;

    const adSet = await AdSetModel.findById(ad.adSetId);
    if (!adSet) return;

    const campaign = await CampaignModel.findById(adSet.campaignId);
    if (!campaign) return;

    const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
    if (!questionnaire) return;

    const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
    await metaApi.updateAdStatus(ad.metaAdId!, 'PAUSED');

    ad.status = 'PAUSED';
    await ad.save();
  }

  /**
   * Adjust budget
   */
  private async adjustBudget(adSetId: string, adjustmentPercent: number): Promise<void> {
    const adSet = await AdSetModel.findById(adSetId);
    if (!adSet || !adSet.dailyBudget) return;

    const campaign = await CampaignModel.findById(adSet.campaignId);
    if (!campaign) return;

    const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
    if (!questionnaire) return;

    const newBudget = Math.floor(adSet.dailyBudget * (1 + adjustmentPercent / 100));

    const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
    await metaApi.updateAdSetBudget(adSet.metaAdSetId!, newBudget);

    adSet.dailyBudget = newBudget;
    await adSet.save();
  }

  /**
   * Send webhook
   */
  private async sendWebhook(url: string, payload: any): Promise<void> {
    const axios = require('axios');
    await axios.post(url, payload);
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(userId: string): Promise<any[]> {
    const anomalies: any[] = [];

    try {
      // Get all campaigns for user
      const campaigns = await CampaignModel.find({ userId, status: { $ne: 'DELETED' } });

      for (const campaign of campaigns) {
        const metrics = await CampaignMetricsModel.findOne({ campaignId: campaign._id });
        if (!metrics) continue;

        // Simple anomaly detection based on historical averages
        // In production, use more sophisticated algorithms

        // Check for unusual CTR
        const avgCTR = 2.0; // This should be calculated from historical data
        const ctrDeviation = Math.abs(metrics.ctr - avgCTR) / avgCTR;

        if (ctrDeviation > 0.5) {
          // More than 50% deviation
          anomalies.push({
            entityType: 'campaign',
            entityId: campaign._id,
            entityName: campaign.name,
            metric: 'ctr',
            anomalyType: metrics.ctr > avgCTR ? 'spike' : 'drop',
            severity: ctrDeviation > 0.8 ? 'high' : 'medium',
            expectedValue: avgCTR,
            actualValue: metrics.ctr,
            deviationPercentage: ctrDeviation * 100,
            detectedAt: new Date(),
            possibleCauses: this.getPossibleCauses('ctr', metrics.ctr > avgCTR),
            recommendations: this.getRecommendations('ctr', metrics.ctr > avgCTR),
          });
        }

        // Check for unusual spend
        const dailyAvgSpend = 100; // This should be calculated from historical data
        const spendDeviation = Math.abs(metrics.spend - dailyAvgSpend) / dailyAvgSpend;

        if (spendDeviation > 0.3) {
          anomalies.push({
            entityType: 'campaign',
            entityId: campaign._id,
            entityName: campaign.name,
            metric: 'spend',
            anomalyType: metrics.spend > dailyAvgSpend ? 'spike' : 'drop',
            severity: spendDeviation > 0.6 ? 'high' : 'medium',
            expectedValue: dailyAvgSpend,
            actualValue: metrics.spend,
            deviationPercentage: spendDeviation * 100,
            detectedAt: new Date(),
            possibleCauses: this.getPossibleCauses('spend', metrics.spend > dailyAvgSpend),
            recommendations: this.getRecommendations('spend', metrics.spend > dailyAvgSpend),
          });
        }
      }

      logger.info(`Detected ${anomalies.length} anomalies`);
    } catch (error: any) {
      logger.error('Error detecting anomalies:', error);
    }

    return anomalies;
  }

  /**
   * Get possible causes for anomaly
   */
  private getPossibleCauses(metric: string, isIncrease: boolean): string[] {
    const causes: { [key: string]: { increase: string[]; decrease: string[] } } = {
      ctr: {
        increase: [
          'Improved ad creative',
          'Better targeting',
          'Seasonal demand increase',
          'Competitor activity decreased',
        ],
        decrease: [
          'Ad fatigue',
          'Poor targeting',
          'Increased competition',
          'Creative needs refresh',
        ],
      },
      spend: {
        increase: [
          'Increased bids',
          'Expanded targeting',
          'Higher competition',
          'Budget cap removed',
        ],
        decrease: [
          'Budget exhausted',
          'Ads paused',
          'Reduced bids',
          'Targeting too narrow',
        ],
      },
      cpc: {
        increase: [
          'Increased competition',
          'Poor ad relevance',
          'Broader targeting',
          'Lower quality score',
        ],
        decrease: [
          'Improved relevance',
          'Better targeting',
          'Decreased competition',
          'Higher quality score',
        ],
      },
    };

    const metricCauses = causes[metric] || { increase: [], decrease: [] };
    return isIncrease ? metricCauses.increase : metricCauses.decrease;
  }

  /**
   * Get recommendations for anomaly
   */
  private getRecommendations(metric: string, isIncrease: boolean): string[] {
    const recommendations: { [key: string]: { increase: string[]; decrease: string[] } } = {
      ctr: {
        increase: [
          'Scale budget to capitalize on high performance',
          'Expand targeting to similar audiences',
          'Test similar creative variations',
        ],
        decrease: [
          'Refresh ad creative',
          'Review and refine targeting',
          'Test new creative formats',
          'Consider pausing if performance continues to decline',
        ],
      },
      spend: {
        increase: [
          'Review budget allocation',
          'Check if ROAS justifies increased spend',
          'Consider setting daily budget caps',
        ],
        decrease: [
          'Increase budget if ROAS is positive',
          'Expand targeting options',
          'Review bid strategy',
        ],
      },
      cpc: {
        increase: [
          'Improve ad relevance score',
          'Refine targeting to more relevant audiences',
          'Test different ad formats',
          'Review landing page experience',
        ],
        decrease: [
          'Scale campaigns with lower CPC',
          'Maintain current strategy',
          'Test new audiences while CPC is low',
        ],
      },
    };

    const metricRecs = recommendations[metric] || { increase: [], decrease: [] };
    return isIncrease ? metricRecs.increase : metricRecs.decrease;
  }
}

export default new AlertRulesEngine();
