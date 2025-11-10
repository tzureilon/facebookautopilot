import { Response } from 'express';
import { ClientRequest } from '../middleware/clientContext.middleware';
import { AlertRuleModel, AlertNotificationModel, NotificationPreferencesModel } from '../models/Alert.model';
import AlertRulesEngine from '../services/AlertRulesEngine';
import logger from '../utils/logger';

export class AlertController {
  /**
   * Create alert rule
   */
  async createRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;
      const ruleData = req.body;

      const rule = await AlertRuleModel.create({
        ...ruleData,
        userId,
        clientId,
        triggerCount: 0,
      });

      logger.info(`Alert rule created: ${rule._id}`);
      res.status(201).json(rule);
    } catch (error: any) {
      logger.error('Create alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all alert rules for user
   */
  async getRules(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;

      const rules = await AlertRuleModel.find(query).sort({ createdAt: -1 });

      res.json(rules);
    } catch (error: any) {
      logger.error('Get alert rules error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get alert rule by ID
   */
  async getRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const rule = await AlertRuleModel.findOne(query);

      if (!rule) {
        res.status(404).json({ error: 'Alert rule not found' });
        return;
      }

      res.json(rule);
    } catch (error: any) {
      logger.error('Get alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update alert rule
   */
  async updateRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;
      const updates = req.body;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const rule = await AlertRuleModel.findOneAndUpdate(
        query,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!rule) {
        res.status(404).json({ error: 'Alert rule not found' });
        return;
      }

      logger.info(`Alert rule updated: ${id}`);
      res.json(rule);
    } catch (error: any) {
      logger.error('Update alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Toggle alert rule
   */
  async toggleRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const rule = await AlertRuleModel.findOne(query);

      if (!rule) {
        res.status(404).json({ error: 'Alert rule not found' });
        return;
      }

      rule.enabled = !rule.enabled;
      await rule.save();

      logger.info(`Alert rule ${rule.enabled ? 'enabled' : 'disabled'}: ${id}`);
      res.json(rule);
    } catch (error: any) {
      logger.error('Toggle alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete alert rule
   */
  async deleteRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const rule = await AlertRuleModel.findOneAndDelete(query);

      if (!rule) {
        res.status(404).json({ error: 'Alert rule not found' });
        return;
      }

      logger.info(`Alert rule deleted: ${id}`);
      res.json({ message: 'Alert rule deleted successfully' });
    } catch (error: any) {
      logger.error('Delete alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all notifications for user
   */
  async getNotifications(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;
      const { status, limit = 50 } = req.query;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;
      if (status) {
        query.status = status;
      }

      const notifications = await AlertNotificationModel.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      res.json(notifications);
    } catch (error: any) {
      logger.error('Get notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const notification = await AlertNotificationModel.findOne(query);

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      // Mark as read
      if (notification.status === 'unread') {
        notification.status = 'read';
        await notification.save();
      }

      res.json(notification);
    } catch (error: any) {
      logger.error('Get notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const notification = await AlertNotificationModel.findOneAndUpdate(
        query,
        { status: 'read' },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json(notification);
    } catch (error: any) {
      logger.error('Mark as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const notification = await AlertNotificationModel.findOneAndUpdate(
        query,
        {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json(notification);
    } catch (error: any) {
      logger.error('Acknowledge notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Resolve notification
   */
  async resolveNotification(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const notification = await AlertNotificationModel.findOneAndUpdate(
        query,
        {
          status: 'resolved',
          resolvedAt: new Date(),
        },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json(notification);
    } catch (error: any) {
      logger.error('Resolve notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId, status: 'unread' };
      if (clientId) query.clientId = clientId;

      await AlertNotificationModel.updateMany(
        query,
        { status: 'read' }
      );

      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      logger.error('Mark all as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId, status: 'unread' };
      if (clientId) query.clientId = clientId;

      const count = await AlertNotificationModel.countDocuments(query);

      res.json({ count });
    } catch (error: any) {
      logger.error('Get unread count error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;

      let preferences = await NotificationPreferencesModel.findOne(query);

      if (!preferences) {
        // Create default preferences
        preferences = await NotificationPreferencesModel.create({
          userId,
          clientId,
          channels: {
            email: { enabled: true, address: req.user?.email, digest: false, digestTime: '09:00' },
            sms: { enabled: false, phoneNumber: '', onlyCritical: true },
            slack: { enabled: false, webhookUrl: '', channels: [] },
            discord: { enabled: false, webhookUrl: '' },
            teams: { enabled: false, webhookUrl: '' },
            inApp: { enabled: true, sound: true, desktop: true },
          },
          quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
          categories: {
            performance: true,
            budget: true,
            anomalies: true,
            abTests: true,
            system: true,
          },
        });
      }

      res.json(preferences);
    } catch (error: any) {
      logger.error('Get preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;
      const updates = req.body;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;

      const preferences = await NotificationPreferencesModel.findOneAndUpdate(
        query,
        updates,
        { new: true, upsert: true, runValidators: true }
      );

      logger.info(`Notification preferences updated for user: ${userId}`);
      res.json(preferences);
    } catch (error: any) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const anomalies = await AlertRulesEngine.detectAnomalies(userId!, clientId);

      res.json(anomalies);
    } catch (error: any) {
      logger.error('Detect anomalies error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Test alert rule
   */
  async testRule(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const rule = await AlertRuleModel.findOne(query);

      if (!rule) {
        res.status(404).json({ error: 'Alert rule not found' });
        return;
      }

      // Evaluate the rule immediately
      await AlertRulesEngine.evaluateRule(rule);

      res.json({ message: 'Alert rule test triggered successfully' });
    } catch (error: any) {
      logger.error('Test alert rule error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AlertController();
