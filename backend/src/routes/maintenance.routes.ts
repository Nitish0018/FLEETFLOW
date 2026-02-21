import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import {
    getMaintenanceLogs,
    getMaintenanceLogById,
    createMaintenanceLog,
    resolveMaintenanceLog,
    deleteMaintenanceLog
} from '../controllers/maintenance.controller';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Get list of maintenance logs
router.get('/', getMaintenanceLogs);

// Get log details
router.get('/:id', getMaintenanceLogById);

// Create service entry
router.post('/', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'SUPER_ADMIN'), createMaintenanceLog);

// Mark as resolved
router.put('/:id/resolve', roleGuard('FLEET_MANAGER', 'DISPATCHER', 'SUPER_ADMIN'), resolveMaintenanceLog);

// Delete a log
router.delete('/:id', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), deleteMaintenanceLog);

export default router;
