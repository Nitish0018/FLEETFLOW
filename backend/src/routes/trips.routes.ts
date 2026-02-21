import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import {
    getTrips,
    getTripById,
    createTrip,
    completeTrip,
    cancelTrip,
    dispatchTrip,
} from '../controllers/trips.controller';

const router = Router();
router.use(authMiddleware);

// List & detail - any authenticated user
router.get('/', getTrips);
router.get('/:id', getTripById);

// Create - DISPATCHER, FLEET_MANAGER, SUPER_ADMIN
router.post('/', roleGuard('DISPATCHER', 'FLEET_MANAGER', 'SUPER_ADMIN'), createTrip);

// Dispatch / Complete / Cancel - DISPATCHER, FLEET_MANAGER, SUPER_ADMIN
router.put('/:id/dispatch', roleGuard('DISPATCHER', 'FLEET_MANAGER', 'SUPER_ADMIN'), dispatchTrip);
router.put('/:id/complete', roleGuard('DISPATCHER', 'FLEET_MANAGER', 'SUPER_ADMIN'), completeTrip);
router.put('/:id/cancel', roleGuard('DISPATCHER', 'FLEET_MANAGER', 'SUPER_ADMIN'), cancelTrip);

export default router;
