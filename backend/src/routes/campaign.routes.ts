import { Router } from 'express';
import campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { extractClientContext } from '../middleware/clientContext.middleware';

const router = Router();

router.use(authenticate);
router.use(extractClientContext);

router.post('/', campaignController.create.bind(campaignController));
router.get('/', campaignController.getAll.bind(campaignController));
router.get('/:id', campaignController.getById.bind(campaignController));
router.put('/:id/status', campaignController.updateStatus.bind(campaignController));
router.delete('/:id', campaignController.delete.bind(campaignController));

export default router;
