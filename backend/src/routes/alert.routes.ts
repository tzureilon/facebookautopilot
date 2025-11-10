import { Router } from 'express';
import alertController from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Alert rules
router.post('/rules', alertController.createRule.bind(alertController));
router.get('/rules', alertController.getRules.bind(alertController));
router.get('/rules/:id', alertController.getRule.bind(alertController));
router.put('/rules/:id', alertController.updateRule.bind(alertController));
router.post('/rules/:id/toggle', alertController.toggleRule.bind(alertController));
router.post('/rules/:id/test', alertController.testRule.bind(alertController));
router.delete('/rules/:id', alertController.deleteRule.bind(alertController));

// Notifications
router.get('/notifications', alertController.getNotifications.bind(alertController));
router.get('/notifications/unread-count', alertController.getUnreadCount.bind(alertController));
router.get('/notifications/:id', alertController.getNotification.bind(alertController));
router.post('/notifications/:id/read', alertController.markAsRead.bind(alertController));
router.post('/notifications/:id/acknowledge', alertController.acknowledgeNotification.bind(alertController));
router.post('/notifications/:id/resolve', alertController.resolveNotification.bind(alertController));
router.post('/notifications/mark-all-read', alertController.markAllAsRead.bind(alertController));

// Preferences
router.get('/preferences', alertController.getPreferences.bind(alertController));
router.put('/preferences', alertController.updatePreferences.bind(alertController));

// Anomaly detection
router.get('/anomalies', alertController.detectAnomalies.bind(alertController));

export default router;
