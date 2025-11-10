export interface ABTest {
  id: string;
  campaignId: string;
  userId: string;
  name: string;
  description?: string;
  testType: 'CREATIVE' | 'AUDIENCE' | 'PLACEMENT' | 'BUDGET';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  variants: ABTestVariant[];
  winnerVariantId?: string;
  confidenceLevel: number;
  minSampleSize: number;
  startDate: Date;
  endDate?: Date;
  targetMetric: 'ctr' | 'cpc' | 'cpm' | 'roas' | 'conversions' | 'costPerConversion';
  budgetSplitStrategy: 'even' | 'weighted' | 'auto';
  autoWinnerEnabled: boolean;
  autoWinnerThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: string;
  description?: string;
  weight: number;
  adIds: string[];
  metrics: ABTestVariantMetrics;
  status: 'active' | 'paused' | 'winner' | 'loser';
}

export interface ABTestVariantMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas?: number;
  costPerConversion?: number;
  revenue?: number;
}

export interface ABTestStatistics {
  variantA: {
    id: string;
    name: string;
    sampleSize: number;
    conversionRate: number;
    mean: number;
    standardError: number;
  };
  variantB: {
    id: string;
    name: string;
    sampleSize: number;
    conversionRate: number;
    mean: number;
    standardError: number;
  };
  zScore: number;
  pValue: number;
  confidenceLevel: number;
  isStatisticallySignificant: boolean;
  winner?: 'A' | 'B' | 'INCONCLUSIVE';
  liftPercentage: number;
  recommendedAction: string;
}

export interface ABTestConfig {
  campaignId: string;
  name: string;
  description?: string;
  testType: 'CREATIVE' | 'AUDIENCE' | 'PLACEMENT' | 'BUDGET';
  variants: Array<{
    name: string;
    description?: string;
    weight: number;
    adIds: string[];
  }>;
  targetMetric: 'ctr' | 'cpc' | 'cpm' | 'roas' | 'conversions' | 'costPerConversion';
  budgetSplitStrategy: 'even' | 'weighted' | 'auto';
  autoWinnerEnabled: boolean;
  autoWinnerThreshold: number;
  minSampleSize: number;
  duration?: number; // days
}

export interface ABTestReport {
  test: ABTest;
  statistics: ABTestStatistics;
  recommendations: string[];
  insights: {
    bestPerformer: string;
    worstPerformer: string;
    totalSpend: number;
    totalConversions: number;
    averageROAS: number;
    potentialSavings: number;
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
}
