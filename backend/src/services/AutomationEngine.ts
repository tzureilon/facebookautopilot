import { Questionnaire, CampaignStructure, AdSetTargeting } from '@meta-automation/shared';
import { IQuestionnaire } from '../models/Questionnaire.model';
import logger from '../utils/logger';

export class AutomationEngine {
  /**
   * Generate optimal campaign structure from questionnaire
   */
  async generateCampaignStructure(questionnaire: IQuestionnaire): Promise<CampaignStructure> {
    logger.info(`Generating campaign structure for questionnaire: ${questionnaire._id}`);

    const { businessInfo, targetAudience, budget, campaignGoals, creatives } = questionnaire;

    // Determine the primary objective based on campaign goals
    const objective = this.mapGoalToObjective(campaignGoals[0]);

    // Generate campaign name
    const campaignName = `${businessInfo.businessName} - ${campaignGoals[0]} - ${new Date().toISOString().split('T')[0]}`;

    // Create campaign structure
    const structure: CampaignStructure = {
      campaign: {
        name: campaignName,
        objective,
        status: 'PAUSED', // Start paused for review
        specialAdCategories: this.determineSpecialAdCategories(businessInfo.industry),
      },
      adSets: [],
      ads: [],
    };

    // Generate ad sets based on targeting strategy
    const adSets = this.generateAdSets(
      campaignName,
      targetAudience,
      budget,
      objective,
      creatives.length
    );

    structure.adSets = adSets;

    // Generate ads for each ad set and creative combination
    adSets.forEach((adSet, adSetIndex) => {
      creatives.forEach((creative, creativeIndex) => {
        const ad = this.generateAd(
          `${campaignName} - AdSet ${adSetIndex + 1} - Creative ${creativeIndex + 1}`,
          creative,
          questionnaire.metaCredentials.pageId || ''
        );
        structure.ads.push({
          adSetIndex,
          ...ad,
        });
      });
    });

    logger.info(`Generated campaign structure with ${structure.adSets.length} ad sets and ${structure.ads.length} ads`);
    return structure;
  }

  /**
   * Map campaign goal to Meta objective
   */
  private mapGoalToObjective(goal: string): string {
    const objectiveMap: { [key: string]: string } = {
      BRAND_AWARENESS: 'BRAND_AWARENESS',
      REACH: 'REACH',
      TRAFFIC: 'LINK_CLICKS',
      ENGAGEMENT: 'POST_ENGAGEMENT',
      APP_INSTALLS: 'APP_INSTALLS',
      VIDEO_VIEWS: 'VIDEO_VIEWS',
      LEAD_GENERATION: 'LEAD_GENERATION',
      MESSAGES: 'MESSAGES',
      CONVERSIONS: 'CONVERSIONS',
      CATALOG_SALES: 'PRODUCT_CATALOG_SALES',
      STORE_TRAFFIC: 'STORE_VISITS',
    };

    return objectiveMap[goal] || 'LINK_CLICKS';
  }

  /**
   * Determine special ad categories based on industry
   */
  private determineSpecialAdCategories(industry: string): string[] {
    const lowerIndustry = industry.toLowerCase();

    if (lowerIndustry.includes('credit') || lowerIndustry.includes('loan') || lowerIndustry.includes('bank')) {
      return ['CREDIT'];
    }

    if (lowerIndustry.includes('job') || lowerIndustry.includes('employ') || lowerIndustry.includes('career')) {
      return ['EMPLOYMENT'];
    }

    if (lowerIndustry.includes('housing') || lowerIndustry.includes('real estate') || lowerIndustry.includes('apartment')) {
      return ['HOUSING'];
    }

    return [];
  }

  /**
   * Generate ad sets with smart targeting and budget distribution
   */
  private generateAdSets(
    campaignName: string,
    targetAudience: any,
    budget: any,
    objective: string,
    creativeCount: number
  ): any[] {
    const adSets: any[] = [];

    // Determine optimization goal and billing event based on objective
    const { optimizationGoal, billingEvent } = this.getOptimizationSettings(objective);

    // Calculate budget per ad set (split evenly)
    const numberOfAdSets = this.determineNumberOfAdSets(targetAudience);
    const budgetPerAdSet = Math.floor((budget.amount / numberOfAdSets) * 100); // Convert to cents

    // Strategy 1: Broad targeting
    adSets.push({
      name: `${campaignName} - Broad Targeting`,
      optimizationGoal,
      billingEvent,
      dailyBudget: budgetPerAdSet,
      targeting: this.createBroadTargeting(targetAudience),
    });

    // Strategy 2: Interest-based targeting (if interests provided)
    if (targetAudience.interests && targetAudience.interests.length > 0) {
      const interestGroups = this.groupInterests(targetAudience.interests);
      interestGroups.forEach((group, index) => {
        adSets.push({
          name: `${campaignName} - Interest Group ${index + 1}`,
          optimizationGoal,
          billingEvent,
          dailyBudget: budgetPerAdSet,
          targeting: this.createInterestTargeting(targetAudience, group),
        });
      });
    }

    // Strategy 3: Age-based segmentation
    if (targetAudience.ageRange.max - targetAudience.ageRange.min > 15) {
      const ageSegments = this.createAgeSegments(targetAudience.ageRange);
      ageSegments.forEach((segment, index) => {
        adSets.push({
          name: `${campaignName} - Age ${segment.min}-${segment.max}`,
          optimizationGoal,
          billingEvent,
          dailyBudget: budgetPerAdSet,
          targeting: this.createAgeTargeting(targetAudience, segment),
        });
      });
    }

    // Limit to reasonable number of ad sets
    return adSets.slice(0, 5);
  }

  /**
   * Get optimization settings based on objective
   */
  private getOptimizationSettings(objective: string): { optimizationGoal: string; billingEvent: string } {
    const settingsMap: { [key: string]: { optimizationGoal: string; billingEvent: string } } = {
      BRAND_AWARENESS: { optimizationGoal: 'BRAND_AWARENESS', billingEvent: 'IMPRESSIONS' },
      REACH: { optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS' },
      LINK_CLICKS: { optimizationGoal: 'LINK_CLICKS', billingEvent: 'LINK_CLICKS' },
      POST_ENGAGEMENT: { optimizationGoal: 'POST_ENGAGEMENT', billingEvent: 'IMPRESSIONS' },
      VIDEO_VIEWS: { optimizationGoal: 'THRUPLAY', billingEvent: 'THRUPLAY' },
      LEAD_GENERATION: { optimizationGoal: 'LEAD_GENERATION', billingEvent: 'IMPRESSIONS' },
      CONVERSIONS: { optimizationGoal: 'CONVERSIONS', billingEvent: 'IMPRESSIONS' },
    };

    return settingsMap[objective] || { optimizationGoal: 'LINK_CLICKS', billingEvent: 'LINK_CLICKS' };
  }

  /**
   * Determine number of ad sets based on targeting complexity
   */
  private determineNumberOfAdSets(targetAudience: any): number {
    let count = 1; // Start with broad targeting

    if (targetAudience.interests && targetAudience.interests.length > 0) {
      count += Math.min(Math.ceil(targetAudience.interests.length / 3), 3);
    }

    if (targetAudience.ageRange.max - targetAudience.ageRange.min > 15) {
      count += 2;
    }

    return Math.min(count, 5); // Max 5 ad sets
  }

  /**
   * Create broad targeting
   */
  private createBroadTargeting(targetAudience: any): AdSetTargeting {
    return {
      geoLocations: {
        countries: targetAudience.locations,
      },
      ageMin: targetAudience.ageRange.min,
      ageMax: targetAudience.ageRange.max,
      genders: this.mapGenderToCode(targetAudience.gender),
    };
  }

  /**
   * Create interest-based targeting
   */
  private createInterestTargeting(targetAudience: any, interests: string[]): AdSetTargeting {
    return {
      geoLocations: {
        countries: targetAudience.locations,
      },
      ageMin: targetAudience.ageRange.min,
      ageMax: targetAudience.ageRange.max,
      genders: this.mapGenderToCode(targetAudience.gender),
      interests: interests.map(interest => ({
        id: this.generateInterestId(interest),
        name: interest,
      })),
    };
  }

  /**
   * Create age-based targeting
   */
  private createAgeTargeting(targetAudience: any, ageSegment: { min: number; max: number }): AdSetTargeting {
    return {
      geoLocations: {
        countries: targetAudience.locations,
      },
      ageMin: ageSegment.min,
      ageMax: ageSegment.max,
      genders: this.mapGenderToCode(targetAudience.gender),
      interests: targetAudience.interests?.map((interest: string) => ({
        id: this.generateInterestId(interest),
        name: interest,
      })),
    };
  }

  /**
   * Group interests into logical groups
   */
  private groupInterests(interests: string[]): string[][] {
    const groups: string[][] = [];
    const groupSize = 3;

    for (let i = 0; i < interests.length; i += groupSize) {
      groups.push(interests.slice(i, i + groupSize));
    }

    return groups;
  }

  /**
   * Create age segments
   */
  private createAgeSegments(ageRange: { min: number; max: number }): Array<{ min: number; max: number }> {
    const segments: Array<{ min: number; max: number }> = [];
    const midPoint = Math.floor((ageRange.min + ageRange.max) / 2);

    segments.push({ min: ageRange.min, max: midPoint });
    segments.push({ min: midPoint + 1, max: ageRange.max });

    return segments;
  }

  /**
   * Map gender string to Meta API code
   */
  private mapGenderToCode(gender: string): number[] {
    if (gender === 'male') return [1];
    if (gender === 'female') return [2];
    return [1, 2]; // All
  }

  /**
   * Generate interest ID (placeholder - in production, use Meta's targeting search)
   */
  private generateInterestId(interest: string): string {
    // In production, this should call Meta's targeting search API
    // For now, return a placeholder
    return `interest_${interest.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Generate ad from creative data
   */
  private generateAd(name: string, creative: any, pageId: string): any {
    const linkData: any = {
      link: creative.linkUrl || '',
      message: creative.primaryText,
      name: creative.headline,
      call_to_action: {
        type: this.mapCallToAction(creative.callToAction),
      },
    };

    if (creative.description) {
      linkData.description = creative.description;
    }

    // Handle different asset types
    if (creative.assets && creative.assets.length > 0) {
      const firstAsset = creative.assets[0];

      if (firstAsset.type === 'image') {
        linkData.image_hash = 'placeholder_hash'; // Will be replaced with actual hash
      } else if (firstAsset.type === 'video') {
        linkData.video_id = 'placeholder_video_id'; // Will be replaced with actual video ID
      }
    }

    return {
      name,
      creative: {
        name: `${name} - Creative`,
        objectStorySpec: {
          pageId,
          linkData,
        },
      },
    };
  }

  /**
   * Map call to action text to Meta API type
   */
  private mapCallToAction(cta: string): string {
    const ctaMap: { [key: string]: string } = {
      'Shop Now': 'SHOP_NOW',
      'Learn More': 'LEARN_MORE',
      'Sign Up': 'SIGN_UP',
      'Download': 'DOWNLOAD',
      'Book Now': 'BOOK_TRAVEL',
      'Contact Us': 'CONTACT_US',
      'Apply Now': 'APPLY_NOW',
      'Get Quote': 'GET_QUOTE',
      'Subscribe': 'SUBSCRIBE',
    };

    return ctaMap[cta] || 'LEARN_MORE';
  }
}

export default AutomationEngine;
