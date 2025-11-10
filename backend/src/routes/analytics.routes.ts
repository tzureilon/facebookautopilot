import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));
router.get('/campaigns/:campaignId', analyticsController.getCampaignAnalytics.bind(analyticsController));
router.post('/campaigns/:campaignId/sync', analyticsController.syncMetrics.bind(analyticsController));
router.get('/alerts', analyticsController.getAlerts.bind(analyticsController));
router.put('/alerts/:alertId/acknowledge', analyticsController.acknowledgeAlert.bind(analyticsController));
router.get('/actions', analyticsController.getActions.bind(analyticsController));

export default router;
