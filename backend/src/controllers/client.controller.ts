import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ClientModel } from '../models/Client.model';
import { CampaignModel } from '../models/Campaign.model';
import { CampaignMetricsModel } from '../models/Analytics.model';
import logger from '../utils/logger';

export class ClientController {
  /**
   * Create new client
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientData = req.body;

      // Check if user has agency role
      if (req.user?.role !== 'agency' && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Only agency users can create clients' });
        return;
      }

      // Default settings
      const defaultSettings = {
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        autoOptimizationEnabled: true,
        autoOptimizationThreshold: 95,
        weeklyReportsEnabled: true,
        monthlyReportsEnabled: true,
        reportEmails: [],
        allowClientPortalAccess: false,
      };

      const client = await ClientModel.create({
        ...clientData,
        userId,
        settings: { ...defaultSettings, ...clientData.settings },
        status: 'active',
        currency: clientData.currency || 'USD',
      });

      logger.info(`Client created: ${client._id} by user ${userId}`);
      res.status(201).json(client);
    } catch (error: any) {
      logger.error('Create client error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all clients for user
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const clients = await ClientModel.find(query).sort({ createdAt: -1 });

      res.json(clients);
    } catch (error: any) {
      logger.error('Get clients error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get client by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const client = await ClientModel.findOne({ _id: id, userId });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      res.json(client);
    } catch (error: any) {
      logger.error('Get client error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get client with stats
   */
  async getWithStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const client = await ClientModel.findOne({ _id: id, userId });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      // Get campaign stats
      const campaigns = await CampaignModel.find({
        clientId: client._id,
        status: { $ne: 'DELETED' },
      });

      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

      // Get total spend and conversions
      const campaignIds = campaigns.map(c => c._id);
      const metrics = await CampaignMetricsModel.find({
        campaignId: { $in: campaignIds },
      });

      let totalSpend = 0;
      let totalConversions = 0;
      let totalRevenue = 0;

      metrics.forEach(m => {
        totalSpend += m.spend;
        totalConversions += m.conversions || 0;
        totalRevenue += m.revenue || 0;
      });

      const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      const lastActivity = campaigns.length > 0
        ? campaigns.reduce((latest, campaign) => {
            return campaign.updatedAt > latest ? campaign.updatedAt : latest;
          }, campaigns[0].updatedAt)
        : undefined;

      const stats = {
        clientId: client._id,
        activeCampaigns,
        totalSpend,
        totalConversions,
        averageROAS,
        lastActivityDate: lastActivity,
      };

      res.json({
        client,
        stats,
      });
    } catch (error: any) {
      logger.error('Get client with stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update client
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      const client = await ClientModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      logger.info(`Client updated: ${id}`);
      res.json(client);
    } catch (error: any) {
      logger.error('Update client error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update client status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const client = await ClientModel.findOneAndUpdate(
        { _id: id, userId },
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      logger.info(`Client ${id} status updated to ${status}`);
      res.json(client);
    } catch (error: any) {
      logger.error('Update client status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update client settings
   */
  async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const settings = req.body;

      const client = await ClientModel.findOne({ _id: id, userId });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      client.settings = { ...client.settings, ...settings };
      await client.save();

      logger.info(`Client ${id} settings updated`);
      res.json(client);
    } catch (error: any) {
      logger.error('Update client settings error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete client
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if client has active campaigns
      const activeCampaigns = await CampaignModel.countDocuments({
        clientId: id,
        status: 'ACTIVE',
      });

      if (activeCampaigns > 0) {
        res.status(400).json({
          error: 'Cannot delete client with active campaigns. Please pause or delete campaigns first.',
          activeCampaigns,
        });
        return;
      }

      const client = await ClientModel.findOneAndDelete({ _id: id, userId });

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      logger.info(`Client deleted: ${id}`);
      res.json({ message: 'Client deleted successfully' });
    } catch (error: any) {
      logger.error('Delete client error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get clients summary (for dashboard)
   */
  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const clients = await ClientModel.find({ userId, status: { $ne: 'inactive' } });

      const summary = await Promise.all(
        clients.map(async (client) => {
          const campaigns = await CampaignModel.find({
            clientId: client._id,
            status: { $ne: 'DELETED' },
          });

          const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

          const campaignIds = campaigns.map(c => c._id);
          const metrics = await CampaignMetricsModel.find({
            campaignId: { $in: campaignIds },
          });

          let totalSpend = 0;
          let totalConversions = 0;
          let totalRevenue = 0;

          metrics.forEach(m => {
            totalSpend += m.spend;
            totalConversions += m.conversions || 0;
            totalRevenue += m.revenue || 0;
          });

          const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

          return {
            client: {
              id: client._id,
              clientName: client.clientName,
              status: client.status,
              company: client.company,
            },
            stats: {
              clientId: client._id,
              activeCampaigns,
              totalSpend,
              totalConversions,
              averageROAS,
            },
          };
        })
      );

      res.json(summary);
    } catch (error: any) {
      logger.error('Get clients summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ClientController();
