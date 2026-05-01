import { Router } from 'express';
import {
  uploadResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  upload,
} from '../controllers/resumes.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/:id', getResume);
router.patch('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;
