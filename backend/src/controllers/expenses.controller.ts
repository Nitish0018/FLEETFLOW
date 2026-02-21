import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ExpenseCategory } from '@prisma/client';

// GET /api/expenses
export const getExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, category, startDate, endDate, page = '1', limit = '50' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const companyId = req.user!.companyId;

        const where: Record<string, any> = { vehicle: { companyId } };
        if (vehicleId) where.vehicleId = String(vehicleId);
        if (category) where.category = category as ExpenseCategory;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(String(startDate));
            if (endDate) where.date.lte = new Date(String(endDate));
        }

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { date: 'desc' },
                include: {
                    vehicle: { select: { name: true, licensePlate: true } }
                }
            }),
            prisma.expense.count({ where })
        ]);

        return res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

// GET /api/expenses/:id
export const getExpenseById = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                vehicle: { select: { name: true, licensePlate: true, companyId: true } }
            }
        });

        if (!expense || expense.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        return res.json(expense);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch expense' });
    }
};

// POST /api/expenses
export const createExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, category, amount, description, date } = req.body;

        if (!vehicleId || !category || !amount || !date) {
            return res.status(400).json({ error: 'vehicleId, category, amount, and date are required' });
        }

        // Verify vehicle belongs to user's company
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: String(vehicleId) },
            select: { companyId: true }
        });

        if (!vehicle || vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const expense = await prisma.expense.create({
            data: {
                vehicleId: String(vehicleId),
                category: category as ExpenseCategory,
                amount: Number(amount),
                description: description || '',
                date: new Date(date)
            },
            include: {
                vehicle: { select: { name: true, licensePlate: true } }
            }
        });

        return res.status(201).json(expense);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create expense' });
    }
};

// PUT /api/expenses/:id
export const updateExpense = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { category, amount, description, date } = req.body;

        // Verify expense belongs to user's company
        const existing = await prisma.expense.findUnique({
            where: { id },
            include: { vehicle: { select: { companyId: true } } }
        });

        if (!existing || existing.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const data: Record<string, any> = {};
        if (category) data.category = category as ExpenseCategory;
        if (amount !== undefined) data.amount = Number(amount);
        if (description !== undefined) data.description = description;
        if (date) data.date = new Date(date);

        const updated = await prisma.expense.update({
            where: { id },
            data,
            include: {
                vehicle: { select: { name: true, licensePlate: true } }
            }
        });

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update expense' });
    }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);

        // Verify expense belongs to user's company
        const existing = await prisma.expense.findUnique({
            where: { id },
            include: { vehicle: { select: { companyId: true } } }
        });

        if (!existing || existing.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await prisma.expense.delete({ where: { id } });

        return res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete expense' });
    }
};

// GET /api/expenses/stats/by-category
export const getExpensesByCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const companyId = req.user!.companyId;

        const where: Record<string, any> = { vehicle: { companyId } };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(String(startDate));
            if (endDate) where.date.lte = new Date(String(endDate));
        }

        const expenses = await prisma.expense.findMany({
            where,
            select: { category: true, amount: true }
        });

        // Group by category
        const categoryData: Record<string, number> = {};
        expenses.forEach(exp => {
            if (!categoryData[exp.category]) {
                categoryData[exp.category] = 0;
            }
            categoryData[exp.category] += exp.amount;
        });

        const breakdown = Object.entries(categoryData).map(([category, amount]) => ({
            category,
            amount
        }));

        return res.json({ breakdown });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch expense breakdown' });
    }
};

// GET /api/expenses/stats/vehicle-operational-cost/:vehicleId
export const getVehicleOperationalCost = async (req: AuthRequest, res: Response) => {
    try {
        const vehicleId = String(req.params.vehicleId);
        const companyId = req.user!.companyId;

        // Verify vehicle belongs to user's company
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { companyId: true, name: true, licensePlate: true }
        });

        if (!vehicle || vehicle.companyId !== companyId) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Get total fuel costs
        const fuelCosts = await prisma.fuelLog.aggregate({
            where: { vehicleId },
            _sum: { cost: true }
        });

        // Get total maintenance costs
        const maintenanceCosts = await prisma.maintenanceLog.aggregate({
            where: { vehicleId, status: 'RESOLVED' },
            _sum: { cost: true }
        });

        const totalFuelCost = fuelCosts._sum.cost || 0;
        const totalMaintenanceCost = maintenanceCosts._sum.cost || 0;
        const totalOperationalCost = totalFuelCost + totalMaintenanceCost;

        return res.json({
            vehicleId,
            vehicleName: vehicle.name,
            licensePlate: vehicle.licensePlate,
            fuelCost: totalFuelCost,
            maintenanceCost: totalMaintenanceCost,
            totalOperationalCost
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to calculate operational cost' });
    }
};
