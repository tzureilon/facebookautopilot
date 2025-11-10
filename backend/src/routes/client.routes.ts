import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Client management
router.post('/', clientController.create.bind(clientController));
router.get('/', clientController.getAll.bind(clientController));
router.get('/summary', clientController.getSummary.bind(clientController));
router.get('/:id', clientController.getById.bind(clientController));
router.get('/:id/stats', clientController.getWithStats.bind(clientController));
router.put('/:id', clientController.update.bind(clientController));
router.put('/:id/status', clientController.updateStatus.bind(clientController));
router.put('/:id/settings', clientController.updateSettings.bind(clientController));
router.delete('/:id', clientController.delete.bind(clientController));

export default router;
