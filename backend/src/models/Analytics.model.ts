import mongoose, { Schema, Document } from 'mongoose';
import { CampaignMetrics, AdSetMetrics, AdMetrics, PerformanceAlert, OptimizationAction, ABTestResult } from '@meta-automation/shared';

export interface ICampaignMetrics extends Omit<CampaignMetrics, 'campaignId'>, Document {
  campaignId: mongoose.Types.ObjectId;
}

export interface IAdSetMetrics extends Omit<AdSetMetrics, 'adSetId'>, Document {
  adSetId: mongoose.Types.ObjectId;
}

export interface IAdMetrics extends Omit<AdMetrics, 'adId'>, Document {
  adId: mongoose.Types.ObjectId;
}

export interface IPerformanceAlert extends Omit<PerformanceAlert, 'id' | 'campaignId' | 'adSetId' | 'adId'>, Document {
  campaignId: mongoose.Types.ObjectId;
  adSetId?: mongoose.Types.ObjectId;
  adId?: mongoose.Types.ObjectId;
}

export interface IOptimizationAction extends Omit<OptimizationAction, 'id' | 'campaignId' | 'adSetId' | 'adId'>, Document {
  campaignId: mongoose.Types.ObjectId;
  adSetId?: mongoose.Types.ObjectId;
  adId?: mongoose.Types.ObjectId;
}

export interface IABTestResult extends Omit<ABTestResult, 'id' | 'campaignId'>, Document {
  campaignId: mongoose.Types.ObjectId;
}

const CampaignMetricsSchema = new Schema<ICampaignMetrics>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    metaCampaignId: { type: String, required: true },
    dateStart: { type: String, required: true },
    dateStop: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    cpp: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    costPerConversion: Number,
    roas: Number,
    revenue: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const AdSetMetricsSchema = new Schema<IAdSetMetrics>(
  {
    adSetId: {
      type: Schema.Types.ObjectId,
      ref: 'AdSet',
      required: true,
    },
    metaAdSetId: { type: String, required: true },
    dateStart: { type: String, required: true },
    dateStop: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    conversions: Number,
    costPerConversion: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const AdMetricsSchema = new Schema<IAdMetrics>(
  {
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
    },
    metaAdId: { type: String, required: true },
    dateStart: { type: String, required: true },
    dateStop: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    conversions: Number,
    costPerConversion: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const PerformanceAlertSchema = new Schema<IPerformanceAlert>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    adSetId: {
      type: Schema.Types.ObjectId,
      ref: 'AdSet',
    },
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
    },
    type: {
      type: String,
      enum: ['LOW_CTR', 'HIGH_CPC', 'LOW_ROAS', 'BUDGET_SPENT', 'LOW_CONVERSIONS'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
    },
    message: { type: String, required: true },
    threshold: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    acknowledged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const OptimizationActionSchema = new Schema<IOptimizationAction>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    adSetId: {
      type: Schema.Types.ObjectId,
      ref: 'AdSet',
    },
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
    },
    action: {
      type: String,
      enum: ['PAUSE', 'ACTIVATE', 'INCREASE_BUDGET', 'DECREASE_BUDGET', 'ADJUST_BID'],
      required: true,
    },
    reason: { type: String, required: true },
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'applied', 'failed'],
      default: 'pending',
    },
    appliedAt: Date,
    error: String,
  },
  {
    timestamps: true,
  }
);

const ABTestResultSchema = new Schema<IABTestResult>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    testName: { type: String, required: true },
    variantA: {
      adId: String,
      name: String,
      metrics: Schema.Types.Mixed,
    },
    variantB: {
      adId: String,
      name: String,
      metrics: Schema.Types.Mixed,
    },
    winner: {
      type: String,
      enum: ['A', 'B', 'INCONCLUSIVE'],
    },
    confidenceLevel: Number,
    status: {
      type: String,
      enum: ['running', 'completed', 'stopped'],
      default: 'running',
    },
    startDate: { type: Date, required: true },
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

export const CampaignMetricsModel = mongoose.model<ICampaignMetrics>('CampaignMetrics', CampaignMetricsSchema);
export const AdSetMetricsModel = mongoose.model<IAdSetMetrics>('AdSetMetrics', AdSetMetricsSchema);
export const AdMetricsModel = mongoose.model<IAdMetrics>('AdMetrics', AdMetricsSchema);
export const PerformanceAlertModel = mongoose.model<IPerformanceAlert>('PerformanceAlert', PerformanceAlertSchema);
export const OptimizationActionModel = mongoose.model<IOptimizationAction>('OptimizationAction', OptimizationActionSchema);
export const ABTestResultModel = mongoose.model<IABTestResult>('ABTestResult', ABTestResultSchema);
