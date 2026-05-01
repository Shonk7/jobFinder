import { Router } from 'express';
import {
  getRecommendations,
  searchJobs,
  getJob,
  saveJob,
  unsaveJob,
  applyToJob,
  getSavedJobs,
} from '../controllers/jobs.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/search', searchJobs);
router.get('/recommendations', authenticateToken, getRecommendations);
router.get('/saved', authenticateToken, getSavedJobs);
router.get('/:id', getJob);
router.post('/:id/save', authenticateToken, saveJob);
router.delete('/:id/save', authenticateToken, unsaveJob);
router.post('/:id/apply', authenticateToken, applyToJob);

export default router;
