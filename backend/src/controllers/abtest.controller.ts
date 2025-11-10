import { Response } from 'express';
import { ClientRequest } from '../middleware/clientContext.middleware';
import ABTestingService from '../services/ABTestingService';
import { ABTestModel } from '../models/ABTest.model';
import logger from '../utils/logger';

export class ABTestController {
  /**
   * Create new A/B test
   */
  async create(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;
      const testConfig = req.body;

      const test = await ABTestingService.createTest(userId!, { ...testConfig, clientId });

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
  async getAll(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;

      const tests = await ABTestModel.find(query).sort({ createdAt: -1 });

      res.json(tests);
    } catch (error: any) {
      logger.error('Get A/B tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get test by ID
   */
  async getById(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);

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
  async getByCampaign(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { campaignId, userId };
      if (clientId) query.clientId = clientId;

      const tests = await ABTestModel.find(query).sort({ createdAt: -1 });

      res.json(tests);
    } catch (error: any) {
      logger.error('Get campaign tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Start test
   */
  async start(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      // Verify ownership
      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
  async pause(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      // Verify ownership
      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
  async getStatistics(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
  async getReport(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
  async updateMetrics(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
  async delete(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const test = await ABTestModel.findOne(query);
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
