import { Router } from 'express';
import { omnibarSearch } from '../controllers/search.controller.js';

const router = Router();

router.get('/omnibar', omnibarSearch);

export default router;

