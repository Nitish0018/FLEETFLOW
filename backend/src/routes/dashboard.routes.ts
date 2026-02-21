import { Router } from 'express';
import { getDashboardSummary, getMonthlyFuel, getVehicleStatusBreakdown } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getDashboardSummary);
router.get('/monthly-fuel', getMonthlyFuel);
router.get('/vehicle-status', getVehicleStatusBreakdown);

export default router;
