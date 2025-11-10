export interface Client {
  id: string;
  userId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  company?: string;
  industry?: string;

  // Meta API Credentials
  metaAdAccountId: string;
  metaAccessToken: string;
  metaPixelId?: string;
  metaPageId?: string;

  // Status
  status: 'active' | 'inactive' | 'suspended';

  // Settings
  settings: ClientSettings;

  // Billing
  billingEmail?: string;
  monthlyBudget?: number;
  currency: string;

  // Metadata
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientSettings {
  // Notifications
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  notificationEmail?: string;
  notificationPhone?: string;

  // Automation
  autoOptimizationEnabled: boolean;
  autoOptimizationThreshold: number;

  // Reporting
  weeklyReportsEnabled: boolean;
  monthlyReportsEnabled: boolean;
  reportEmails: string[];

  // Access
  allowClientPortalAccess: boolean;
  clientPortalUrl?: string;

  // Limits
  maxCampaigns?: number;
  maxMonthlySpend?: number;
}

export interface ClientCreateData {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  company?: string;
  industry?: string;
  metaAdAccountId: string;
  metaAccessToken: string;
  metaPixelId?: string;
  metaPageId?: string;
  billingEmail?: string;
  monthlyBudget?: number;
  currency?: string;
  notes?: string;
  tags?: string[];
  settings?: Partial<ClientSettings>;
}

export interface ClientUpdateData {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  company?: string;
  industry?: string;
  metaAdAccountId?: string;
  metaAccessToken?: string;
  metaPixelId?: string;
  metaPageId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  billingEmail?: string;
  monthlyBudget?: number;
  currency?: string;
  notes?: string;
  tags?: string[];
  settings?: Partial<ClientSettings>;
}

export interface ClientStats {
  clientId: string;
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  averageROAS: number;
  lastActivityDate?: Date;
}

export interface ClientSummary {
  client: Client;
  stats: ClientStats;
}
