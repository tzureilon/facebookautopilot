import mongoose, { Schema, Document } from 'mongoose';
import { ABTest, ABTestVariant, ABTestVariantMetrics } from '@meta-automation/shared';

export interface IABTest extends Omit<ABTest, 'id'>, Document {}
export interface IABTestVariant extends Omit<ABTestVariant, 'id' | 'testId'>, Document {
  testId: mongoose.Types.ObjectId;
}

const ABTestVariantMetricsSchema = new Schema<ABTestVariantMetrics>({
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  roas: Number,
  costPerConversion: Number,
  revenue: Number,
}, { _id: false });

const ABTestVariantSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  weight: { type: Number, required: true, min: 0, max: 100 },
  adIds: [{ type: String }],
  metrics: { type: ABTestVariantMetricsSchema, default: {} },
  status: {
    type: String,
    enum: ['active', 'paused', 'winner', 'loser'],
    default: 'active',
  },
}, { _id: true });

const ABTestSchema = new Schema<IABTest>(
  {
    campaignId: {
      type: String,
      required: true,
      ref: 'Campaign',
    },
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
    name: {
      type: String,
      required: true,
    },
    description: String,
    testType: {
      type: String,
      enum: ['CREATIVE', 'AUDIENCE', 'PLACEMENT', 'BUDGET'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
      default: 'draft',
    },
    variants: [ABTestVariantSchema],
    winnerVariantId: String,
    confidenceLevel: {
      type: Number,
      default: 95,
      min: 90,
      max: 99,
    },
    minSampleSize: {
      type: Number,
      default: 100,
      min: 30,
    },
    startDate: Date,
    endDate: Date,
    targetMetric: {
      type: String,
      enum: ['ctr', 'cpc', 'cpm', 'roas', 'conversions', 'costPerConversion'],
      required: true,
    },
    budgetSplitStrategy: {
      type: String,
      enum: ['even', 'weighted', 'auto'],
      default: 'even',
    },
    autoWinnerEnabled: {
      type: Boolean,
      default: true,
    },
    autoWinnerThreshold: {
      type: Number,
      default: 95,
      min: 90,
      max: 99,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ABTestSchema.index({ campaignId: 1, status: 1 });
ABTestSchema.index({ userId: 1, status: 1 });
ABTestSchema.index({ status: 1, autoWinnerEnabled: 1 });

export const ABTestModel = mongoose.model<IABTest>('ABTest', ABTestSchema);
