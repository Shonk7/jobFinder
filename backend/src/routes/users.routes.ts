import { Router } from 'express';
import {
  getMe,
  updateMe,
  deleteMe,
  updatePreferences,
  getPreferences,
} from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';
import { validate, userPreferencesSchema, updateUserSchema } from '../validation/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/me', getMe);
router.patch('/me', validate(updateUserSchema), updateMe);
router.delete('/me', deleteMe);
router.get('/me/preferences', getPreferences);
router.put('/me/preferences', validate(userPreferencesSchema), updatePreferences);

export default router;
