import { Request, Response } from 'express';
import ClientModel from '../models/Client.model';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all clients for the authenticated user
 */
export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const clients = await ClientModel.find({ agencyUserId: userId })
      .select('-metaCredentials.accessToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const client = await ClientModel.findOne({
      _id: id,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Return sanitized version without access token
    const sanitizedClient = {
      ...client.toObject(),
      metaCredentials: {
        adAccountId: client.metaCredentials.adAccountId,
        pixelId: client.metaCredentials.pixelId,
        pageId: client.metaCredentials.pageId,
        hasAccessToken: !!client.metaCredentials.accessToken,
      },
    };

    res.json({
      success: true,
      data: sanitizedClient,
    });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error.message,
    });
  }
};

/**
 * Create a new client
 */
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const clientData = {
      ...req.body,
      agencyUserId: userId,
    };

    const client = await ClientModel.create(clientData);

    // Return sanitized version
    const sanitizedClient = {
      ...client.toObject(),
      metaCredentials: {
        adAccountId: client.metaCredentials.adAccountId,
        pixelId: client.metaCredentials.pixelId,
        pageId: client.metaCredentials.pageId,
        hasAccessToken: !!client.metaCredentials.accessToken,
      },
    };

    res.status(201).json({
      success: true,
      data: sanitizedClient,
      message: 'Client created successfully',
    });
  } catch (error: any) {
    console.error('Error creating client:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((e: any) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error.message,
    });
  }
};

/**
 * Update a client
 */
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Find client and verify ownership
    const client = await ClientModel.findOne({
      _id: id,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Update client
    Object.assign(client, req.body);
    await client.save();

    // Return sanitized version
    const sanitizedClient = {
      ...client.toObject(),
      metaCredentials: {
        adAccountId: client.metaCredentials.adAccountId,
        pixelId: client.metaCredentials.pixelId,
        pageId: client.metaCredentials.pageId,
        hasAccessToken: !!client.metaCredentials.accessToken,
      },
    };

    res.json({
      success: true,
      data: sanitizedClient,
      message: 'Client updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating client:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((e: any) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message,
    });
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const client = await ClientModel.findOneAndDelete({
      _id: id,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message,
    });
  }
};

/**
 * Get client statistics
 */
export const getClientStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify client ownership
    const client = await ClientModel.findOne({
      _id: id,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Import models dynamically to avoid circular dependencies
    const { CampaignModel } = await import('../models/Campaign.model');
    const { CampaignMetricsModel } = await import('../models/Analytics.model');

    // Get campaign count
    const campaignCount = await CampaignModel.countDocuments({ clientId: id });

    // Get aggregate metrics
    const metricsAgg = await CampaignMetricsModel.aggregate([
      { $match: { clientId: client._id } },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$spend' },
          totalClicks: { $sum: '$clicks' },
          totalImpressions: { $sum: '$impressions' },
          totalConversions: { $sum: '$conversions' },
        },
      },
    ]);

    const metrics = metricsAgg[0] || {
      totalSpend: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
    };

    // Calculate derived metrics
    const avgCtr = metrics.totalImpressions > 0
      ? (metrics.totalClicks / metrics.totalImpressions) * 100
      : 0;

    const avgCpc = metrics.totalClicks > 0
      ? metrics.totalSpend / metrics.totalClicks
      : 0;

    res.json({
      success: true,
      data: {
        clientId: id,
        clientName: client.name,
        campaignCount,
        totalSpend: metrics.totalSpend,
        totalClicks: metrics.totalClicks,
        totalImpressions: metrics.totalImpressions,
        totalConversions: metrics.totalConversions,
        avgCtr: avgCtr.toFixed(2),
        avgCpc: avgCpc.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client statistics',
      error: error.message,
    });
  }
};

/**
 * Toggle client status (active/inactive)
 */
export const toggleClientStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const client = await ClientModel.findOne({
      _id: id,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Toggle between active and inactive
    client.status = client.status === 'active' ? 'inactive' : 'active';
    await client.save();

    res.json({
      success: true,
      data: {
        clientId: id,
        status: client.status,
      },
      message: `Client ${client.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling client status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle client status',
      error: error.message,
    });
  }
};
