import { Router } from 'express';
import abtestController from '../controllers/abtest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { extractClientContext } from '../middleware/clientContext.middleware';

const router = Router();

router.use(authenticate);
router.use(extractClientContext);

// Test management
router.post('/', abtestController.create.bind(abtestController));
router.get('/', abtestController.getAll.bind(abtestController));
router.get('/:id', abtestController.getById.bind(abtestController));
router.get('/campaign/:campaignId', abtestController.getByCampaign.bind(abtestController));
router.post('/:id/start', abtestController.start.bind(abtestController));
router.post('/:id/pause', abtestController.pause.bind(abtestController));
router.delete('/:id', abtestController.delete.bind(abtestController));

// Test analytics
router.get('/:id/statistics', abtestController.getStatistics.bind(abtestController));
router.get('/:id/report', abtestController.getReport.bind(abtestController));
router.post('/:id/update-metrics', abtestController.updateMetrics.bind(abtestController));

export default router;
