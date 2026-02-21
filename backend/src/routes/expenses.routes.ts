import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getVehicleOperationalCost
} from '../controllers/expenses.controller';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Get list of expenses
router.get('/', getExpenses);

// Get expense breakdown by category
router.get('/stats/by-category', getExpensesByCategory);

// Get vehicle operational cost
router.get('/stats/vehicle-operational-cost/:vehicleId', getVehicleOperationalCost);

// Get expense details
router.get('/:id', getExpenseById);

// Create expense entry
router.post('/', roleGuard('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SUPER_ADMIN'), createExpense);

// Update expense
router.put('/:id', roleGuard('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SUPER_ADMIN'), updateExpense);

// Delete an expense
router.delete('/:id', roleGuard('FLEET_MANAGER', 'SUPER_ADMIN'), deleteExpense);

export default router;
