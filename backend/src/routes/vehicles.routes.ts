import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import {
    getVehicles, getVehicleById, createVehicle,
    updateVehicle, updateVehicleStatus, deleteVehicle,
} from '../controllers/vehicles.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), createVehicle);
router.put('/:id', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), updateVehicle);
router.put('/:id/status', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), updateVehicleStatus);
router.delete('/:id', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), deleteVehicle);

export default router;
