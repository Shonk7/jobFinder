import { Router } from 'express';
import { triggerScrape } from '../controllers/scraper.controller';

const router = Router();

// No auth — local-only dev tool. Add IP check or auth if ever exposed publicly.
router.post('/', triggerScrape);

export default router;
