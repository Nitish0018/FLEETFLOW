import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/auth.middleware';
import { getDrivers, getDriverById, createDriver, updateDriver, updateDriverStatus } from '../controllers/drivers.controller';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// List drivers (all roles) – used in trip creation selectors
router.get('/', getDrivers);

// Get driver by id
router.get('/:id', getDriverById);

// Create driver (Fleet Manager, Dispatcher, Admin)
router.post('/', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'SUPER_ADMIN'), createDriver);

// Update driver details
router.put('/:id', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'SUPER_ADMIN'), updateDriver);

// Update driver status
router.put('/:id/status', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'SUPER_ADMIN'), updateDriverStatus);

export default router;
