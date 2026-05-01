import { Router } from 'express';
import {
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/applications.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getApplications);
router.get('/:id', getApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

export default router;
