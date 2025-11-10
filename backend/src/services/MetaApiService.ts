import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import { AdSetTargeting, AdCreativeDetails } from '@meta-automation/shared';

export class MetaApiService {
  private client: AxiosInstance;
  private accessToken: string;
  private apiVersion: string;

  constructor(accessToken: string, apiVersion: string = 'v19.0') {
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a campaign in Meta
   */
  async createCampaign(
    adAccountId: string,
    name: string,
    objective: string,
    status: string = 'PAUSED',
    specialAdCategories?: string[]
  ): Promise<any> {
    try {
      const response = await this.client.post(`/act_${adAccountId}/campaigns`, {
        name,
        objective,
        status,
        special_ad_categories: specialAdCategories || [],
        access_token: this.accessToken,
      });

      logger.info(`Campaign created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating campaign:', error.response?.data || error.message);
      throw new Error(`Failed to create campaign: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create an ad set in Meta
   */
  async createAdSet(
    adAccountId: string,
    campaignId: string,
    name: string,
    optimizationGoal: string,
    billingEvent: string,
    dailyBudget: number,
    targeting: AdSetTargeting,
    status: string = 'PAUSED'
  ): Promise<any> {
    try {
      const response = await this.client.post(`/act_${adAccountId}/adsets`, {
        name,
        campaign_id: campaignId,
        optimization_goal: optimizationGoal,
        billing_event: billingEvent,
        daily_budget: dailyBudget,
        targeting: this.formatTargeting(targeting),
        status,
        access_token: this.accessToken,
      });

      logger.info(`AdSet created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating ad set:', error.response?.data || error.message);
      throw new Error(`Failed to create ad set: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create an ad in Meta
   */
  async createAd(
    adAccountId: string,
    adSetId: string,
    name: string,
    creative: AdCreativeDetails,
    status: string = 'PAUSED'
  ): Promise<any> {
    try {
      // First create the creative
      const creativeResponse = await this.createCreative(adAccountId, creative);
      const creativeId = creativeResponse.id;

      // Then create the ad
      const response = await this.client.post(`/act_${adAccountId}/ads`, {
        name,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status,
        access_token: this.accessToken,
      });

      logger.info(`Ad created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating ad:', error.response?.data || error.message);
      throw new Error(`Failed to create ad: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create ad creative
   */
  async createCreative(adAccountId: string, creative: AdCreativeDetails): Promise<any> {
    try {
      const response = await this.client.post(`/act_${adAccountId}/adcreatives`, {
        name: creative.name,
        object_story_spec: creative.objectStorySpec,
        degrees_of_freedom_spec: creative.degreesOfFreedomSpec,
        access_token: this.accessToken,
      });

      logger.info(`Creative created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating creative:', error.response?.data || error.message);
      throw new Error(`Failed to create creative: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Upload image to Meta
   */
  async uploadImage(adAccountId: string, imageUrl: string): Promise<string> {
    try {
      const response = await this.client.post(`/act_${adAccountId}/adimages`, {
        url: imageUrl,
        access_token: this.accessToken,
      });

      const imageHash = Object.keys(response.data.images)[0];
      logger.info(`Image uploaded: ${imageHash}`);
      return imageHash;
    } catch (error: any) {
      logger.error('Error uploading image:', error.response?.data || error.message);
      throw new Error(`Failed to upload image: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Upload video to Meta
   */
  async uploadVideo(adAccountId: string, videoUrl: string): Promise<string> {
    try {
      const response = await this.client.post(`/act_${adAccountId}/advideos`, {
        file_url: videoUrl,
        access_token: this.accessToken,
      });

      logger.info(`Video uploaded: ${response.data.id}`);
      return response.data.id;
    } catch (error: any) {
      logger.error('Error uploading video:', error.response?.data || error.message);
      throw new Error(`Failed to upload video: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get campaign insights
   */
  async getCampaignInsights(
    campaignId: string,
    fields: string[] = ['impressions', 'clicks', 'spend', 'reach', 'ctr', 'cpc', 'cpm'],
    datePreset: string = 'last_7d'
  ): Promise<any> {
    try {
      const response = await this.client.get(`/${campaignId}/insights`, {
        params: {
          fields: fields.join(','),
          date_preset: datePreset,
          access_token: this.accessToken,
        },
      });

      return response.data.data[0] || {};
    } catch (error: any) {
      logger.error('Error getting campaign insights:', error.response?.data || error.message);
      throw new Error(`Failed to get insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get ad set insights
   */
  async getAdSetInsights(
    adSetId: string,
    fields: string[] = ['impressions', 'clicks', 'spend', 'reach', 'ctr', 'cpc', 'cpm'],
    datePreset: string = 'last_7d'
  ): Promise<any> {
    try {
      const response = await this.client.get(`/${adSetId}/insights`, {
        params: {
          fields: fields.join(','),
          date_preset: datePreset,
          access_token: this.accessToken,
        },
      });

      return response.data.data[0] || {};
    } catch (error: any) {
      logger.error('Error getting ad set insights:', error.response?.data || error.message);
      throw new Error(`Failed to get insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get ad insights
   */
  async getAdInsights(
    adId: string,
    fields: string[] = ['impressions', 'clicks', 'spend', 'reach', 'ctr', 'cpc', 'cpm'],
    datePreset: string = 'last_7d'
  ): Promise<any> {
    try {
      const response = await this.client.get(`/${adId}/insights`, {
        params: {
          fields: fields.join(','),
          date_preset: datePreset,
          access_token: this.accessToken,
        },
      });

      return response.data.data[0] || {};
    } catch (error: any) {
      logger.error('Error getting ad insights:', error.response?.data || error.message);
      throw new Error(`Failed to get insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<any> {
    try {
      const response = await this.client.post(`/${campaignId}`, {
        status,
        access_token: this.accessToken,
      });

      logger.info(`Campaign ${campaignId} status updated to ${status}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating campaign status:', error.response?.data || error.message);
      throw new Error(`Failed to update campaign: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update ad set status
   */
  async updateAdSetStatus(adSetId: string, status: 'ACTIVE' | 'PAUSED'): Promise<any> {
    try {
      const response = await this.client.post(`/${adSetId}`, {
        status,
        access_token: this.accessToken,
      });

      logger.info(`AdSet ${adSetId} status updated to ${status}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating ad set status:', error.response?.data || error.message);
      throw new Error(`Failed to update ad set: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update ad status
   */
  async updateAdStatus(adId: string, status: 'ACTIVE' | 'PAUSED'): Promise<any> {
    try {
      const response = await this.client.post(`/${adId}`, {
        status,
        access_token: this.accessToken,
      });

      logger.info(`Ad ${adId} status updated to ${status}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating ad status:', error.response?.data || error.message);
      throw new Error(`Failed to update ad: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update ad set budget
   */
  async updateAdSetBudget(adSetId: string, dailyBudget: number): Promise<any> {
    try {
      const response = await this.client.post(`/${adSetId}`, {
        daily_budget: dailyBudget,
        access_token: this.accessToken,
      });

      logger.info(`AdSet ${adSetId} budget updated to ${dailyBudget}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating ad set budget:', error.response?.data || error.message);
      throw new Error(`Failed to update budget: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Search targeting interests
   */
  async searchTargetingInterests(query: string): Promise<any[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          type: 'adinterest',
          q: query,
          access_token: this.accessToken,
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      logger.error('Error searching interests:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Format targeting for Meta API
   */
  private formatTargeting(targeting: AdSetTargeting): any {
    const formatted: any = {};

    if (targeting.geoLocations) {
      formatted.geo_locations = targeting.geoLocations;
    }

    if (targeting.ageMin) {
      formatted.age_min = targeting.ageMin;
    }

    if (targeting.ageMax) {
      formatted.age_max = targeting.ageMax;
    }

    if (targeting.genders && targeting.genders.length > 0) {
      formatted.genders = targeting.genders;
    }

    if (targeting.interests && targeting.interests.length > 0) {
      formatted.interests = targeting.interests.map(i => ({ id: i.id }));
    }

    if (targeting.behaviors && targeting.behaviors.length > 0) {
      formatted.behaviors = targeting.behaviors.map(b => ({ id: b.id }));
    }

    if (targeting.flexibleSpec) {
      formatted.flexible_spec = targeting.flexibleSpec;
    }

    if (targeting.customAudiences) {
      formatted.custom_audiences = targeting.customAudiences.map(id => ({ id }));
    }

    if (targeting.excludedCustomAudiences) {
      formatted.excluded_custom_audiences = targeting.excludedCustomAudiences.map(id => ({ id }));
    }

    return formatted;
  }
}

export default MetaApiService;
