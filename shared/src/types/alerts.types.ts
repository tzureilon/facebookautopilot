export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Conditions
  entity: 'campaign' | 'adset' | 'ad' | 'account';
  entityIds?: string[]; // specific entities, or empty for all
  metric: 'ctr' | 'cpc' | 'cpm' | 'roas' | 'spend' | 'conversions' | 'frequency' | 'relevance_score';
  operator: 'greater_than' | 'less_than' | 'equals' | 'changes_by' | 'drops_by' | 'increases_by';
  threshold: number;
  timeWindow: number; // minutes

  // Actions
  actions: AlertAction[];

  // Notification settings
  notificationChannels: NotificationChannel[];
  frequency: 'immediate' | 'hourly' | 'daily';
  cooldownPeriod: number; // minutes before firing again

  // Metadata
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertAction {
  type: 'notify' | 'pause_campaign' | 'pause_adset' | 'pause_ad' | 'adjust_budget' | 'send_webhook';
  config: {
    budgetAdjustment?: number; // percentage
    webhookUrl?: string;
    webhookPayload?: any;
  };
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'discord' | 'teams' | 'webhook' | 'in_app';
  config: {
    email?: string;
    phoneNumber?: string;
    slackWebhook?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
    webhookUrl?: string;
  };
  enabled: boolean;
}

export interface AlertNotification {
  id: string;
  alertRuleId: string;
  userId: string;

  // Alert details
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;

  // Context
  entityType: 'campaign' | 'adset' | 'ad' | 'account';
  entityId: string;
  entityName: string;
  metric: string;
  currentValue: number;
  threshold: number;

  // Status
  status: 'unread' | 'read' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;

  // Actions taken
  actionsTaken: Array<{
    action: string;
    status: 'pending' | 'success' | 'failed';
    error?: string;
    timestamp: Date;
  }>;

  createdAt: Date;
}

export interface AnomalyDetection {
  id: string;
  entityType: 'campaign' | 'adset' | 'ad';
  entityId: string;
  metric: string;

  // Anomaly details
  anomalyType: 'spike' | 'drop' | 'trend_change' | 'outlier';
  severity: 'low' | 'medium' | 'high';
  expectedValue: number;
  actualValue: number;
  deviationPercentage: number;

  // Statistical info
  zScore: number;
  confidence: number;

  // Context
  detectedAt: Date;
  affectedPeriod: {
    start: Date;
    end: Date;
  };
  possibleCauses: string[];
  recommendations: string[];
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      address: string;
      digest: boolean; // send daily digest instead of immediate
      digestTime: string; // HH:mm format
    };
    sms: {
      enabled: boolean;
      phoneNumber: string;
      onlyCritical: boolean;
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channels: string[];
    };
    discord: {
      enabled: boolean;
      webhookUrl: string;
    };
    teams: {
      enabled: boolean;
      webhookUrl: string;
    };
    inApp: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  categories: {
    performance: boolean;
    budget: boolean;
    anomalies: boolean;
    abTests: boolean;
    system: boolean;
  };
}

export interface AlertDigest {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    topIssues: Array<{
      issue: string;
      count: number;
      affectedCampaigns: number;
    }>;
  };
  alerts: AlertNotification[];
  recommendations: string[];
}
