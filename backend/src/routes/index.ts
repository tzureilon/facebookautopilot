import { Router } from 'express';
import authRoutes from './auth.routes';
import questionnaireRoutes from './questionnaire.routes';
import campaignRoutes from './campaign.routes';
import analyticsRoutes from './analytics.routes';
import abtestRoutes from './abtest.routes';
import alertRoutes from './alert.routes';
import clientRoutes from './client.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/questionnaire', questionnaireRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/abtests', abtestRoutes);
router.use('/alerts', alertRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
