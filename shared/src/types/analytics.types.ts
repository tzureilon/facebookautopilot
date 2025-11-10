export interface CampaignMetrics {
  campaignId: string;
  metaCampaignId: string;
  dateStart: string;
  dateStop: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpp: number;
  conversions?: number;
  costPerConversion?: number;
  roas?: number;
  revenue?: number;
  updatedAt: Date;
}

export interface AdSetMetrics {
  adSetId: string;
  metaAdSetId: string;
  dateStart: string;
  dateStop: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  costPerConversion?: number;
  updatedAt: Date;
}

export interface AdMetrics {
  adId: string;
  metaAdId: string;
  dateStart: string;
  dateStop: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  costPerConversion?: number;
  updatedAt: Date;
}

export interface PerformanceAlert {
  id: string;
  campaignId: string;
  adSetId?: string;
  adId?: string;
  type: 'LOW_CTR' | 'HIGH_CPC' | 'LOW_ROAS' | 'BUDGET_SPENT' | 'LOW_CONVERSIONS';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
  acknowledged: boolean;
}

export interface OptimizationAction {
  id: string;
  campaignId: string;
  adSetId?: string;
  adId?: string;
  action: 'PAUSE' | 'ACTIVATE' | 'INCREASE_BUDGET' | 'DECREASE_BUDGET' | 'ADJUST_BID';
  reason: string;
  previousValue?: any;
  newValue?: any;
  status: 'pending' | 'applied' | 'failed';
  createdAt: Date;
  appliedAt?: Date;
  error?: string;
}

export interface DashboardData {
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCTR: number;
    averageCPC: number;
    averageROAS: number;
  };
  campaigns: CampaignMetrics[];
  recentAlerts: PerformanceAlert[];
  recentActions: OptimizationAction[];
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
}

export interface ABTestResult {
  id: string;
  campaignId: string;
  testName: string;
  variantA: {
    adId: string;
    name: string;
    metrics: AdMetrics;
  };
  variantB: {
    adId: string;
    name: string;
    metrics: AdMetrics;
  };
  winner?: 'A' | 'B' | 'INCONCLUSIVE';
  confidenceLevel?: number;
  status: 'running' | 'completed' | 'stopped';
  startDate: Date;
  endDate?: Date;
}
