import { Router } from 'express';
import authRoutes from './auth.routes';
import questionnaireRoutes from './questionnaire.routes';
import campaignRoutes from './campaign.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questionnaire', questionnaireRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
