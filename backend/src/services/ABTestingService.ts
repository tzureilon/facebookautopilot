import { ABTestModel } from '../models/ABTest.model';
import { AdMetricsModel } from '../models/Analytics.model';
import { AdModel } from '../models/Campaign.model';
import { ABTestConfig, ABTestStatistics, ABTestReport } from '@meta-automation/shared';
import logger from '../utils/logger';

export class ABTestingService {
  /**
   * Create a new A/B test
   */
  async createTest(userId: string, config: ABTestConfig): Promise<any> {
    try {
      // Validate weights sum to 100
      const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error('Variant weights must sum to 100%');
      }

      // Create test
      const test = await ABTestModel.create({
        userId,
        campaignId: config.campaignId,
        name: config.name,
        description: config.description,
        testType: config.testType,
        variants: config.variants.map(v => ({
          name: v.name,
          description: v.description,
          weight: v.weight,
          adIds: v.adIds,
          metrics: {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
          },
          status: 'active',
        })),
        targetMetric: config.targetMetric,
        budgetSplitStrategy: config.budgetSplitStrategy,
        autoWinnerEnabled: config.autoWinnerEnabled,
        autoWinnerThreshold: config.autoWinnerThreshold,
        minSampleSize: config.minSampleSize,
        confidenceLevel: config.autoWinnerThreshold,
        status: 'draft',
      });

      logger.info(`A/B Test created: ${test._id}`);
      return test;
    } catch (error: any) {
      logger.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<any> {
    try {
      const test = await ABTestModel.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'draft' && test.status !== 'paused') {
        throw new Error('Test can only be started from draft or paused status');
      }

      test.status = 'running';
      test.startDate = new Date();
      await test.save();

      logger.info(`A/B Test started: ${testId}`);
      return test;
    } catch (error: any) {
      logger.error('Error starting A/B test:', error);
      throw error;
    }
  }

  /**
   * Pause an A/B test
   */
  async pauseTest(testId: string): Promise<any> {
    try {
      const test = await ABTestModel.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      test.status = 'paused';
      await test.save();

      logger.info(`A/B Test paused: ${testId}`);
      return test;
    } catch (error: any) {
      logger.error('Error pausing A/B test:', error);
      throw error;
    }
  }

  /**
   * Update test metrics from ad performance
   */
  async updateTestMetrics(testId: string): Promise<void> {
    try {
      const test = await ABTestModel.findById(testId);
      if (!test || test.status !== 'running') {
        return;
      }

      for (const variant of test.variants) {
        if (variant.adIds.length === 0) continue;

        // Get metrics for all ads in this variant
        const adMetrics = await AdMetricsModel.find({
          adId: { $in: variant.adIds },
        });

        // Aggregate metrics
        const aggregated = adMetrics.reduce(
          (acc, metrics) => ({
            impressions: acc.impressions + metrics.impressions,
            clicks: acc.clicks + metrics.clicks,
            spend: acc.spend + metrics.spend,
            conversions: acc.conversions + (metrics.conversions || 0),
            revenue: acc.revenue + (metrics.revenue || 0),
          }),
          { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
        );

        // Calculate derived metrics
        variant.metrics = {
          ...aggregated,
          ctr: aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0,
          cpc: aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0,
          cpm: aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0,
          costPerConversion:
            aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : undefined,
          roas: aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : undefined,
        };
      }

      await test.save();
      logger.info(`Updated metrics for test: ${testId}`);
    } catch (error: any) {
      logger.error('Error updating test metrics:', error);
    }
  }

  /**
   * Calculate statistical significance between two variants
   */
  calculateStatistics(testId: string, variantAId: string, variantBId: string): ABTestStatistics {
    // This is a placeholder - you should use a proper statistics library
    // For production, consider using libraries like jStat or mathjs

    // Simplified Z-test for proportions
    const calculateZScore = (
      p1: number,
      n1: number,
      p2: number,
      n2: number
    ): { zScore: number; pValue: number } => {
      const pooledProportion = (p1 * n1 + p2 * n2) / (n1 + n2);
      const standardError = Math.sqrt(
        pooledProportion * (1 - pooledProportion) * (1 / n1 + 1 / n2)
      );

      if (standardError === 0) {
        return { zScore: 0, pValue: 1 };
      }

      const zScore = (p1 - p2) / standardError;

      // Approximate p-value from z-score (two-tailed test)
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

      return { zScore, pValue };
    };

    // Placeholder return - in real implementation, fetch actual test data
    return {
      variantA: {
        id: variantAId,
        name: 'Variant A',
        sampleSize: 0,
        conversionRate: 0,
        mean: 0,
        standardError: 0,
      },
      variantB: {
        id: variantBId,
        name: 'Variant B',
        sampleSize: 0,
        conversionRate: 0,
        mean: 0,
        standardError: 0,
      },
      zScore: 0,
      pValue: 1,
      confidenceLevel: 95,
      isStatisticallySignificant: false,
      liftPercentage: 0,
      recommendedAction: 'Continue test - insufficient data',
    };
  }

  /**
   * Calculate cumulative distribution function for normal distribution
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  /**
   * Check if test has reached statistical significance and declare winner
   */
  async checkAndDeclareWinner(testId: string): Promise<boolean> {
    try {
      const test = await ABTestModel.findById(testId);
      if (!test || test.status !== 'running' || !test.autoWinnerEnabled) {
        return false;
      }

      if (test.variants.length !== 2) {
        // Multi-variant tests not yet supported for auto-winner
        return false;
      }

      const [variantA, variantB] = test.variants;

      // Check minimum sample size
      if (
        variantA.metrics.impressions < test.minSampleSize ||
        variantB.metrics.impressions < test.minSampleSize
      ) {
        return false;
      }

      // Get metric values based on target metric
      const getMetricValue = (variant: any) => {
        switch (test.targetMetric) {
          case 'ctr':
            return variant.metrics.ctr;
          case 'cpc':
            return variant.metrics.cpc;
          case 'cpm':
            return variant.metrics.cpm;
          case 'conversions':
            return variant.metrics.conversions;
          case 'roas':
            return variant.metrics.roas || 0;
          case 'costPerConversion':
            return variant.metrics.costPerConversion || 0;
          default:
            return 0;
        }
      };

      const metricA = getMetricValue(variantA);
      const metricB = getMetricValue(variantB);

      // Determine if metric is "higher is better" or "lower is better"
      const higherIsBetter = ['ctr', 'conversions', 'roas'].includes(test.targetMetric);
      const lowerIsBetter = ['cpc', 'cpm', 'costPerConversion'].includes(test.targetMetric);

      // Simple statistical test (in production, use proper library)
      const difference = Math.abs(metricA - metricB);
      const average = (metricA + metricB) / 2;
      const percentDifference = average !== 0 ? (difference / average) * 100 : 0;

      // Require at least 10% difference and minimum impressions
      const isSignificant =
        percentDifference > 10 &&
        variantA.metrics.impressions > test.minSampleSize * 2 &&
        variantB.metrics.impressions > test.minSampleSize * 2;

      if (isSignificant) {
        let winnerId: string;

        if (higherIsBetter) {
          winnerId = metricA > metricB ? variantA.id : variantB.id;
        } else if (lowerIsBetter) {
          winnerId = metricA < metricB ? variantA.id : variantB.id;
        } else {
          return false;
        }

        // Update test status
        test.winnerVariantId = winnerId;
        test.status = 'completed';
        test.endDate = new Date();

        // Update variant statuses
        test.variants.forEach(v => {
          v.status = v.id === winnerId ? 'winner' : 'loser';
        });

        await test.save();

        logger.info(`Winner declared for test ${testId}: Variant ${winnerId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Error checking for winner:', error);
      return false;
    }
  }

  /**
   * Generate test report
   */
  async generateReport(testId: string): Promise<ABTestReport> {
    try {
      const test = await ABTestModel.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Calculate statistics for first two variants
      let statistics: ABTestStatistics | undefined;
      if (test.variants.length >= 2) {
        statistics = this.calculateStatistics(
          testId,
          test.variants[0].id,
          test.variants[1].id
        );
      }

      // Generate insights
      const totalSpend = test.variants.reduce((sum, v) => sum + v.metrics.spend, 0);
      const totalConversions = test.variants.reduce(
        (sum, v) => sum + v.metrics.conversions,
        0
      );
      const totalRevenue = test.variants.reduce(
        (sum, v) => sum + (v.metrics.revenue || 0),
        0
      );

      const bestPerformer = test.variants.reduce((best, current) => {
        const currentMetric =
          current.metrics[test.targetMetric as keyof typeof current.metrics] || 0;
        const bestMetric = best.metrics[test.targetMetric as keyof typeof best.metrics] || 0;
        return currentMetric > bestMetric ? current : best;
      });

      const worstPerformer = test.variants.reduce((worst, current) => {
        const currentMetric =
          current.metrics[test.targetMetric as keyof typeof current.metrics] || 0;
        const worstMetric =
          worst.metrics[test.targetMetric as keyof typeof worst.metrics] || 0;
        return currentMetric < worstMetric ? current : worst;
      });

      // Generate recommendations
      const recommendations: string[] = [];
      if (test.status === 'completed' && test.winnerVariantId) {
        recommendations.push(
          `Winner declared: ${test.variants.find(v => v.id === test.winnerVariantId)?.name}`
        );
        recommendations.push(
          'Consider pausing losing variants and scaling the winner'
        );
      } else if (test.variants.every(v => v.metrics.impressions < test.minSampleSize)) {
        recommendations.push(
          `Need more data: Each variant needs at least ${test.minSampleSize} impressions`
        );
      } else {
        recommendations.push('Test is still running - continue collecting data');
      }

      // Chart data
      const chartData = {
        labels: test.variants.map(v => v.name),
        datasets: [
          {
            label: test.targetMetric.toUpperCase(),
            data: test.variants.map(
              v => v.metrics[test.targetMetric as keyof typeof v.metrics] || 0
            ),
          },
        ],
      };

      return {
        test: test.toObject(),
        statistics: statistics || ({} as ABTestStatistics),
        recommendations,
        insights: {
          bestPerformer: bestPerformer.name,
          worstPerformer: worstPerformer.name,
          totalSpend,
          totalConversions,
          averageROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
          potentialSavings:
            worstPerformer.metrics.spend > 0 ? worstPerformer.metrics.spend * 0.5 : 0,
        },
        chartData,
      };
    } catch (error: any) {
      logger.error('Error generating test report:', error);
      throw error;
    }
  }

  /**
   * Get all tests for a campaign
   */
  async getTestsByCampaign(campaignId: string): Promise<any[]> {
    return ABTestModel.find({ campaignId }).sort({ createdAt: -1 });
  }

  /**
   * Get all tests for a user
   */
  async getTestsByUser(userId: string): Promise<any[]> {
    return ABTestModel.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Delete a test
   */
  async deleteTest(testId: string): Promise<void> {
    await ABTestModel.findByIdAndDelete(testId);
    logger.info(`A/B Test deleted: ${testId}`);
  }
}

export default new ABTestingService();
