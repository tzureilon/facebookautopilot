import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CampaignModel, AdSetModel, AdModel } from '../models/Campaign.model';
import Questionnaire from '../models/Questionnaire.model';
import MetaApiService from '../services/MetaApiService';
import AutomationEngine from '../services/AutomationEngine';
import logger from '../utils/logger';

export class CampaignController {
  private automationEngine = new AutomationEngine();

  /**
   * Create campaign from questionnaire
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { questionnaireId } = req.body;
      const userId = req.user?.id;

      // Get questionnaire
      const questionnaire = await Questionnaire.findOne({ _id: questionnaireId, userId });
      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      // Update questionnaire status
      questionnaire.status = 'processing';
      await questionnaire.save();

      // Generate campaign structure
      const structure = await this.automationEngine.generateCampaignStructure(questionnaire);

      // Initialize Meta API
      const metaApi = new MetaApiService(
        questionnaire.metaCredentials.accessToken,
        process.env.META_API_VERSION || 'v19.0'
      );

      // Create campaign in Meta
      const metaCampaign = await metaApi.createCampaign(
        questionnaire.metaCredentials.adAccountId,
        structure.campaign.name,
        structure.campaign.objective,
        structure.campaign.status,
        structure.campaign.specialAdCategories
      );

      // Create campaign in database
      const campaign = await CampaignModel.create({
        questionnaireId: questionnaire._id,
        userId,
        clientId: questionnaire.clientId,
        metaCampaignId: metaCampaign.id,
        name: structure.campaign.name,
        objective: structure.campaign.objective,
        status: 'PAUSED',
      });

      // Create ad sets
      for (let i = 0; i < structure.adSets.length; i++) {
        const adSetData = structure.adSets[i];

        // Create ad set in Meta
        const metaAdSet = await metaApi.createAdSet(
          questionnaire.metaCredentials.adAccountId,
          metaCampaign.id,
          adSetData.name,
          adSetData.optimizationGoal,
          adSetData.billingEvent,
          adSetData.dailyBudget,
          adSetData.targeting,
          'PAUSED'
        );

        // Create ad set in database
        const adSet = await AdSetModel.create({
          campaignId: campaign._id,
          clientId: questionnaire.clientId,
          metaAdSetId: metaAdSet.id,
          name: adSetData.name,
          status: 'PAUSED',
          billingEvent: adSetData.billingEvent,
          optimizationGoal: adSetData.optimizationGoal,
          dailyBudget: adSetData.dailyBudget,
          targeting: adSetData.targeting,
        });

        campaign.adSets.push(adSet._id);

        // Create ads for this ad set
        const adsForThisAdSet = structure.ads.filter(ad => ad.adSetIndex === i);

        for (const adData of adsForThisAdSet) {
          // Upload creative assets if needed
          if (questionnaire.creatives[0]?.assets?.[0]?.url) {
            const asset = questionnaire.creatives[0].assets[0];
            if (asset.type === 'image') {
              const imageHash = await metaApi.uploadImage(
                questionnaire.metaCredentials.adAccountId,
                asset.url
              );
              adData.creative.objectStorySpec!.linkData!.imageHash = imageHash;
            }
          }

          // Create ad in Meta
          const metaAd = await metaApi.createAd(
            questionnaire.metaCredentials.adAccountId,
            metaAdSet.id,
            adData.name,
            adData.creative,
            'PAUSED'
          );

          // Create ad in database
          const ad = await AdModel.create({
            adSetId: adSet._id,
            clientId: questionnaire.clientId,
            metaAdId: metaAd.id,
            name: adData.name,
            status: 'PAUSED',
            creative: adData.creative,
          });

          adSet.ads.push(ad._id);
        }

        await adSet.save();
      }

      await campaign.save();

      // Update questionnaire status
      questionnaire.status = 'completed';
      await questionnaire.save();

      logger.info(`Campaign created successfully: ${campaign._id}`);

      res.status(201).json(campaign);
    } catch (error: any) {
      logger.error('Create campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all campaigns for user
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { clientId } = req.query;

      // Build query
      const query: any = { userId };
      if (clientId) {
        query.clientId = clientId;
      }

      const campaigns = await CampaignModel.find(query)
        .populate('adSets')
        .sort({ createdAt: -1 });

      res.json(campaigns);
    } catch (error: any) {
      logger.error('Get campaigns error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get campaign by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const campaign = await CampaignModel.findOne({ _id: id, userId })
        .populate({
          path: 'adSets',
          populate: { path: 'ads' },
        });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json(campaign);
    } catch (error: any) {
      logger.error('Get campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update campaign status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      const campaign = await CampaignModel.findOne({ _id: id, userId });

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

      // Update in Meta
      const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
      await metaApi.updateCampaignStatus(campaign.metaCampaignId!, status);

      // Update in database
      campaign.status = status;
      await campaign.save();

      logger.info(`Campaign ${id} status updated to ${status}`);

      res.json(campaign);
    } catch (error: any) {
      logger.error('Update campaign status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete campaign
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const campaign = await CampaignModel.findOne({ _id: id, userId });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Get credentials
      const questionnaire = await Questionnaire.findById(campaign.questionnaireId);
      if (questionnaire) {
        // Archive in Meta (not delete)
        const metaApi = new MetaApiService(questionnaire.metaCredentials.accessToken);
        try {
          await metaApi.updateCampaignStatus(campaign.metaCampaignId!, 'PAUSED');
        } catch (error) {
          logger.warn('Failed to pause campaign in Meta:', error);
        }
      }

      // Update status in database
      campaign.status = 'DELETED';
      await campaign.save();

      logger.info(`Campaign deleted: ${id}`);

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error: any) {
      logger.error('Delete campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CampaignController();
