import mongoose, { Schema, Document } from 'mongoose';
import { Client, ClientSettings } from '@meta-automation/shared';

export interface IClient extends Omit<Client, 'id'>, Document {}

const ClientSettingsSchema = new Schema<ClientSettings>({
  enableEmailNotifications: { type: Boolean, default: true },
  enableSmsNotifications: { type: Boolean, default: false },
  notificationEmail: String,
  notificationPhone: String,
  autoOptimizationEnabled: { type: Boolean, default: true },
  autoOptimizationThreshold: { type: Number, default: 95 },
  weeklyReportsEnabled: { type: Boolean, default: true },
  monthlyReportsEnabled: { type: Boolean, default: true },
  reportEmails: [String],
  allowClientPortalAccess: { type: Boolean, default: false },
  clientPortalUrl: String,
  maxCampaigns: Number,
  maxMonthlySpend: Number,
}, { _id: false });

const ClientSchema = new Schema<IClient>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    clientPhone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    metaAdAccountId: {
      type: String,
      required: true,
      index: true,
    },
    metaAccessToken: {
      type: String,
      required: true,
    },
    metaPixelId: String,
    metaPageId: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    settings: {
      type: ClientSettingsSchema,
      default: {},
    },
    billingEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    monthlyBudget: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ClientSchema.index({ userId: 1, status: 1 });
ClientSchema.index({ userId: 1, clientName: 1 });
ClientSchema.index({ metaAdAccountId: 1 });

// Virtual for client stats (can be populated separately)
ClientSchema.virtual('stats', {
  ref: 'Campaign',
  localField: '_id',
  foreignField: 'clientId',
  justOne: false,
});

export const ClientModel = mongoose.model<IClient>('Client', ClientSchema);
