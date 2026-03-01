import { Router } from 'express';
import {
  getApplicationStatus,
  createServiceRequest,
  getServices,
  getServiceStatus
} from '../controllers/serviceController.js';
import { authGuard } from '../middleware/auth.js';

const router = Router();

router.get('/', authGuard, getServices);
router.post('/request', authGuard, createServiceRequest);
router.get('/status/:id', authGuard, getServiceStatus);
router.get('/application-status/:id', authGuard, getApplicationStatus);

export default router;
