import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import ABTestingService from '../services/ABTestingService';
import { ABTestModel } from '../models/ABTest.model';
import logger from '../utils/logger';

export class ABTestController {
  /**
   * Create new A/B test
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const testConfig = req.body;

      const test = await ABTestingService.createTest(userId!, testConfig);

      logger.info(`A/B test created: ${test._id}`);
      res.status(201).json(test);
    } catch (error: any) {
      logger.error('Create A/B test error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all tests for user
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const tests = await ABTestingService.getTestsByUser(userId!);

      res.json(tests);
    } catch (error: any) {
      logger.error('Get A/B tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get test by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const test = await ABTestModel.findOne({ _id: id, userId });

      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      res.json(test);
    } catch (error: any) {
      logger.error('Get A/B test error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get tests for a campaign
   */
  async getByCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const tests = await ABTestingService.getTestsByCampaign(campaignId);

      res.json(tests);
    } catch (error: any) {
      logger.error('Get campaign tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Start test
   */
  async start(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      const updatedTest = await ABTestingService.startTest(id);

      res.json(updatedTest);
    } catch (error: any) {
      logger.error('Start A/B test error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Pause test
   */
  async pause(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      const updatedTest = await ABTestingService.pauseTest(id);

      res.json(updatedTest);
    } catch (error: any) {
      logger.error('Pause A/B test error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get test statistics
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      if (test.variants.length < 2) {
        res.status(400).json({ error: 'Test must have at least 2 variants' });
        return;
      }

      const statistics = ABTestingService.calculateStatistics(
        id,
        test.variants[0].id,
        test.variants[1].id
      );

      res.json(statistics);
    } catch (error: any) {
      logger.error('Get test statistics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get test report
   */
  async getReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      const report = await ABTestingService.generateReport(id);

      res.json(report);
    } catch (error: any) {
      logger.error('Get test report error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update test metrics
   */
  async updateMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      await ABTestingService.updateTestMetrics(id);

      res.json({ message: 'Metrics updated successfully' });
    } catch (error: any) {
      logger.error('Update test metrics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete test
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const test = await ABTestModel.findOne({ _id: id, userId });
      if (!test) {
        res.status(404).json({ error: 'Test not found' });
        return;
      }

      await ABTestingService.deleteTest(id);

      res.json({ message: 'Test deleted successfully' });
    } catch (error: any) {
      logger.error('Delete A/B test error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ABTestController();
