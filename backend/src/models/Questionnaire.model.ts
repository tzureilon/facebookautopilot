import mongoose, { Schema, Document } from 'mongoose';
import { Questionnaire } from '@meta-automation/shared';

export interface IQuestionnaire extends Omit<Questionnaire, 'id'>, Document {}

const QuestionnaireSchema = new Schema<IQuestionnaire>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    businessInfo: {
      businessName: { type: String, required: true },
      industry: { type: String, required: true },
      products: [{ type: String }],
      website: String,
      description: String,
    },
    targetAudience: {
      ageRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'all'],
        required: true,
      },
      locations: [{ type: String }],
      interests: [{ type: String }],
      behaviors: [{ type: String }],
      detailedTargeting: [{ type: String }],
    },
    budget: {
      type: {
        type: String,
        enum: ['daily', 'lifetime'],
        required: true,
      },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    campaignGoals: [{
      type: String,
      enum: [
        'BRAND_AWARENESS',
        'REACH',
        'TRAFFIC',
        'ENGAGEMENT',
        'APP_INSTALLS',
        'VIDEO_VIEWS',
        'LEAD_GENERATION',
        'MESSAGES',
        'CONVERSIONS',
        'CATALOG_SALES',
        'STORE_TRAFFIC',
      ],
    }],
    creatives: [{
      headline: { type: String, required: true },
      primaryText: { type: String, required: true },
      description: String,
      callToAction: { type: String, required: true },
      assets: [{
        id: String,
        type: {
          type: String,
          enum: ['image', 'video', 'carousel'],
        },
        url: String,
        filename: String,
        size: Number,
        dimensions: {
          width: Number,
          height: Number,
        },
        thumbnailUrl: String,
      }],
      linkUrl: String,
      displayLink: String,
    }],
    metaCredentials: {
      accessToken: { type: String, required: true },
      adAccountId: { type: String, required: true },
      pixelId: String,
      pageId: String,
    },
    additionalNotes: String,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'processing', 'completed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestionnaire>('Questionnaire', QuestionnaireSchema);
