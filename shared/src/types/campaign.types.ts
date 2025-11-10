export interface Campaign {
  id: string;
  questionnaireId: string;
  userId: string;
  metaCampaignId?: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  budgetRemaining?: number;
  effectiveStatus?: string;
  adSets: AdSet[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSet {
  id: string;
  campaignId: string;
  metaAdSetId?: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  billingEvent: string;
  optimizationGoal: string;
  bidAmount?: number;
  dailyBudget?: number;
  lifetimeBudget?: number;
  targeting: AdSetTargeting;
  ads: Ad[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSetTargeting {
  geoLocations?: {
    countries?: string[];
    cities?: Array<{ key: string; name: string }>;
    regions?: Array<{ key: string; name: string }>;
  };
  ageMin?: number;
  ageMax?: number;
  genders?: number[];
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  flexibleSpec?: any[];
  customAudiences?: string[];
  excludedCustomAudiences?: string[];
}

export interface Ad {
  id: string;
  adSetId: string;
  metaAdId?: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  creative: AdCreativeDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdCreativeDetails {
  metaCreativeId?: string;
  name: string;
  objectStorySpec?: {
    pageId: string;
    linkData?: {
      link: string;
      message: string;
      name: string;
      description?: string;
      callToAction?: {
        type: string;
        value?: {
          link: string;
        };
      };
      imageHash?: string;
      videoId?: string;
    };
  };
  degreesOfFreedomSpec?: any;
}

export interface CampaignStructure {
  campaign: {
    name: string;
    objective: string;
    status: string;
    specialAdCategories?: string[];
  };
  adSets: Array<{
    name: string;
    optimizationGoal: string;
    billingEvent: string;
    bidAmount?: number;
    dailyBudget?: number;
    targeting: AdSetTargeting;
  }>;
  ads: Array<{
    adSetIndex: number;
    name: string;
    creative: AdCreativeDetails;
  }>;
}
