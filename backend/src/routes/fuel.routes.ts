import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import {
    getFuelLogs,
    getFuelLogById,
    createFuelLog,
    updateFuelLog,
    deleteFuelLog,
    getMonthlyFuelTrend
} from '../controllers/fuel.controller';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Get list of fuel logs
router.get('/', getFuelLogs);

// Get monthly fuel trend stats
router.get('/stats/monthly-trend', getMonthlyFuelTrend);

// Get log details
router.get('/:id', getFuelLogById);

// Create fuel log entry
router.post('/', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST', 'SUPER_ADMIN'), createFuelLog);

// Update fuel log
router.put('/:id', roleGuard('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SUPER_ADMIN'), updateFuelLog);

// Delete a log
router.delete('/:id', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), deleteFuelLog);

export default router;
