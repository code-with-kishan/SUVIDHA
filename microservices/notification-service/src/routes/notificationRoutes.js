import { Router } from 'express';
import { sendEmailNotification, sendSmsNotification } from '../controllers/notificationController.js';

const router = Router();

router.post('/sms', sendSmsNotification);
router.post('/email', sendEmailNotification);

export default router;
