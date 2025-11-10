import { Router } from 'express';
import questionnaireController from '../controllers/questionnaire.controller';
import { authenticate } from '../middleware/auth.middleware';
import { extractClientContext } from '../middleware/clientContext.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);
router.use(extractClientContext);

router.post('/', questionnaireController.create.bind(questionnaireController));
router.get('/', questionnaireController.getAll.bind(questionnaireController));
router.get('/:id', questionnaireController.getById.bind(questionnaireController));
router.put('/:id', questionnaireController.update.bind(questionnaireController));
router.post('/:id/submit', questionnaireController.submit.bind(questionnaireController));
router.delete('/:id', questionnaireController.delete.bind(questionnaireController));
router.post('/upload', upload.single('file'), questionnaireController.uploadAsset.bind(questionnaireController));

export default router;
