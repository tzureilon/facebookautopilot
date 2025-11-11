export interface BusinessInfo {
  businessName: string;
  industry: string;
  products: string[];
  website?: string;
  description?: string;
}

export interface TargetAudience {
  ageRange: {
    min: number;
    max: number;
  };
  gender: 'male' | 'female' | 'all';
  locations: string[];
  interests: string[];
  behaviors?: string[];
  detailedTargeting?: string[];
}

export interface Budget {
  type: 'daily' | 'lifetime';
  amount: number;
  currency: string;
}

export type CampaignGoal =
  | 'BRAND_AWARENESS'
  | 'REACH'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'APP_INSTALLS'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'MESSAGES'
  | 'CONVERSIONS'
  | 'CATALOG_SALES'
  | 'STORE_TRAFFIC';

export interface CreativeAsset {
  id: string;
  type: 'image' | 'video' | 'carousel';
  url: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnailUrl?: string;
}

export interface AdCreative {
  headline: string;
  primaryText: string;
  description?: string;
  callToAction: string;
  assets: CreativeAsset[];
  linkUrl?: string;
  displayLink?: string;
}

export interface MetaApiCredentials {
  accessToken: string;
  adAccountId: string;
  pixelId?: string;
  pageId?: string;
}

export interface Questionnaire {
  id: string;
  userId: string;
  clientId?: string;
  businessInfo: BusinessInfo;
  targetAudience: TargetAudience;
  budget: Budget;
  campaignGoals: CampaignGoal[];
  creatives: AdCreative[];
  metaCredentials: MetaApiCredentials;
  additionalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'submitted' | 'processing' | 'completed';
}

export interface QuestionnaireSubmission {
  businessInfo: BusinessInfo;
  targetAudience: TargetAudience;
  budget: Budget;
  campaignGoals: CampaignGoal[];
  creatives: AdCreative[];
  metaCredentials: MetaApiCredentials;
  additionalNotes?: string;
}
