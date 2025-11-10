import mongoose, { Schema, Document } from 'mongoose';
import { Campaign, AdSet, Ad } from '@meta-automation/shared';

export interface ICampaign extends Omit<Campaign, 'id' | 'adSets'>, Document {
  adSets: mongoose.Types.ObjectId[];
}

export interface IAdSet extends Omit<AdSet, 'id' | 'ads'>, Document {
  ads: mongoose.Types.ObjectId[];
}

export interface IAd extends Omit<Ad, 'id'>, Document {}

const AdCreativeSchema = new Schema({
  metaCreativeId: String,
  name: { type: String, required: true },
  objectStorySpec: {
    pageId: String,
    linkData: {
      link: String,
      message: String,
      name: String,
      description: String,
      callToAction: {
        type: String,
        value: {
          link: String,
        },
      },
      imageHash: String,
      videoId: String,
    },
  },
  degreesOfFreedomSpec: Schema.Types.Mixed,
});

const AdSchema = new Schema<IAd>(
  {
    adSetId: {
      type: String,
      required: true,
      ref: 'AdSet',
    },
    metaAdId: String,
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    creative: AdCreativeSchema,
  },
  {
    timestamps: true,
  }
);

const TargetingSchema = new Schema({
  geoLocations: {
    countries: [String],
    cities: [{
      key: String,
      name: String,
    }],
    regions: [{
      key: String,
      name: String,
    }],
  },
  ageMin: Number,
  ageMax: Number,
  genders: [Number],
  interests: [{
    id: String,
    name: String,
  }],
  behaviors: [{
    id: String,
    name: String,
  }],
  flexibleSpec: [Schema.Types.Mixed],
  customAudiences: [String],
  excludedCustomAudiences: [String],
});

const AdSetSchema = new Schema<IAdSet>(
  {
    campaignId: {
      type: String,
      required: true,
      ref: 'Campaign',
    },
    metaAdSetId: String,
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    billingEvent: { type: String, required: true },
    optimizationGoal: { type: String, required: true },
    bidAmount: Number,
    dailyBudget: Number,
    lifetimeBudget: Number,
    targeting: TargetingSchema,
    ads: [{
      type: Schema.Types.ObjectId,
      ref: 'Ad',
    }],
  },
  {
    timestamps: true,
  }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    questionnaireId: {
      type: String,
      required: true,
      ref: 'Questionnaire',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    clientId: {
      type: String,
      ref: 'Client',
      index: true,
    },
    metaCampaignId: String,
    name: { type: String, required: true },
    objective: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    budgetRemaining: Number,
    effectiveStatus: String,
    adSets: [{
      type: Schema.Types.ObjectId,
      ref: 'AdSet',
    }],
  },
  {
    timestamps: true,
  }
);

export const AdModel = mongoose.model<IAd>('Ad', AdSchema);
export const AdSetModel = mongoose.model<IAdSet>('AdSet', AdSetSchema);
export const CampaignModel = mongoose.model<ICampaign>('Campaign', CampaignSchema);
