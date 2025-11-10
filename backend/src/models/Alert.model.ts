import mongoose, { Schema, Document } from 'mongoose';
import { AlertRule, AlertNotification, NotificationChannel, AlertAction, NotificationPreferences } from '@meta-automation/shared';

export interface IAlertRule extends Omit<AlertRule, 'id'>, Document {}
export interface IAlertNotification extends Omit<AlertNotification, 'id'>, Document {}
export interface INotificationPreferences extends Omit<NotificationPreferences, 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const AlertActionSchema = new Schema<AlertAction>({
  type: {
    type: String,
    enum: ['notify', 'pause_campaign', 'pause_adset', 'pause_ad', 'adjust_budget', 'send_webhook'],
    required: true,
  },
  config: {
    budgetAdjustment: Number,
    webhookUrl: String,
    webhookPayload: Schema.Types.Mixed,
  },
}, { _id: false });

const NotificationChannelSchema = new Schema<NotificationChannel>({
  type: {
    type: String,
    enum: ['email', 'sms', 'slack', 'discord', 'teams', 'webhook', 'in_app'],
    required: true,
  },
  config: {
    email: String,
    phoneNumber: String,
    slackWebhook: String,
    discordWebhook: String,
    teamsWebhook: String,
    webhookUrl: String,
  },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    enabled: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    entity: {
      type: String,
      enum: ['campaign', 'adset', 'ad', 'account'],
      required: true,
    },
    entityIds: [String],
    metric: {
      type: String,
      enum: ['ctr', 'cpc', 'cpm', 'roas', 'spend', 'conversions', 'frequency', 'relevance_score'],
      required: true,
    },
    operator: {
      type: String,
      enum: ['greater_than', 'less_than', 'equals', 'changes_by', 'drops_by', 'increases_by'],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    timeWindow: {
      type: Number,
      default: 60,
    },
    actions: [AlertActionSchema],
    notificationChannels: [NotificationChannelSchema],
    frequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily'],
      default: 'immediate',
    },
    cooldownPeriod: {
      type: Number,
      default: 60,
    },
    lastTriggered: Date,
    triggerCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const AlertNotificationSchema = new Schema<IAlertNotification>(
  {
    alertRuleId: {
      type: String,
      required: true,
      ref: 'AlertRule',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['campaign', 'adset', 'ad', 'account'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    metric: {
      type: String,
      required: true,
    },
    currentValue: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'acknowledged', 'resolved'],
      default: 'unread',
    },
    acknowledgedAt: Date,
    acknowledgedBy: String,
    resolvedAt: Date,
    actionsTaken: [{
      action: String,
      status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
      },
      error: String,
      timestamp: Date,
    }],
  },
  {
    timestamps: true,
  }
);

const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  channels: {
    email: {
      enabled: { type: Boolean, default: true },
      address: String,
      digest: { type: Boolean, default: false },
      digestTime: { type: String, default: '09:00' },
    },
    sms: {
      enabled: { type: Boolean, default: false },
      phoneNumber: String,
      onlyCritical: { type: Boolean, default: true },
    },
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String,
      channels: [String],
    },
    discord: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String,
    },
    teams: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String,
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
    },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: String,
    end: String,
    timezone: { type: String, default: 'UTC' },
  },
  categories: {
    performance: { type: Boolean, default: true },
    budget: { type: Boolean, default: true },
    anomalies: { type: Boolean, default: true },
    abTests: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
  },
});

// Indexes
AlertRuleSchema.index({ userId: 1, enabled: 1 });
AlertRuleSchema.index({ entity: 1, entityIds: 1 });
AlertNotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
AlertNotificationSchema.index({ alertRuleId: 1, createdAt: -1 });

export const AlertRuleModel = mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
export const AlertNotificationModel = mongoose.model<IAlertNotification>('AlertNotification', AlertNotificationSchema);
export const NotificationPreferencesModel = mongoose.model<INotificationPreferences>('NotificationPreferences', NotificationPreferencesSchema);
