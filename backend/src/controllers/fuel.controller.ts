import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/fuel
export const getFuelLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, startDate, endDate, page = '1', limit = '50' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const companyId = req.user!.companyId;

        const where: Record<string, any> = { vehicle: { companyId } };
        if (vehicleId) where.vehicleId = String(vehicleId);
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(String(startDate));
            if (endDate) where.date.lte = new Date(String(endDate));
        }

        const [logs, total] = await Promise.all([
            prisma.fuelLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { date: 'desc' },
                include: {
                    vehicle: { select: { name: true, licensePlate: true } },
                    trip: { select: { origin: true, destination: true } }
                }
            }),
            prisma.fuelLog.count({ where })
        ]);

        return res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch fuel logs' });
    }
};

// GET /api/fuel/:id
export const getFuelLogById = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const log = await prisma.fuelLog.findUnique({
            where: { id },
            include: {
                vehicle: { select: { name: true, licensePlate: true, companyId: true } },
                trip: { select: { origin: true, destination: true } }
            }
        });

        if (!log || log.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Fuel log not found' });
        }

        return res.json(log);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch fuel log' });
    }
};

// POST /api/fuel
export const createFuelLog = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, tripId, litres, cost, date } = req.body;

        if (!vehicleId || !litres || !cost || !date) {
            return res.status(400).json({ error: 'vehicleId, litres, cost, and date are required' });
        }

        // Verify vehicle belongs to user's company
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: String(vehicleId) },
            select: { companyId: true }
        });

        if (!vehicle || vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const log = await prisma.fuelLog.create({
            data: {
                vehicleId: String(vehicleId),
                tripId: tripId ? String(tripId) : null,
                litres: Number(litres),
                cost: Number(cost),
                date: new Date(date)
            },
            include: {
                vehicle: { select: { name: true, licensePlate: true } },
                trip: { select: { origin: true, destination: true } }
            }
        });

        return res.status(201).json(log);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create fuel log' });
    }
};

// PUT /api/fuel/:id
export const updateFuelLog = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { litres, cost, date } = req.body;

        // Verify fuel log belongs to user's company
        const existing = await prisma.fuelLog.findUnique({
            where: { id },
            include: { vehicle: { select: { companyId: true } } }
        });

        if (!existing || existing.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Fuel log not found' });
        }

        const data: Record<string, any> = {};
        if (litres !== undefined) data.litres = Number(litres);
        if (cost !== undefined) data.cost = Number(cost);
        if (date) data.date = new Date(date);

        const updated = await prisma.fuelLog.update({
            where: { id },
            data,
            include: {
                vehicle: { select: { name: true, licensePlate: true } },
                trip: { select: { origin: true, destination: true } }
            }
        });

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update fuel log' });
    }
};

// DELETE /api/fuel/:id
export const deleteFuelLog = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);

        // Verify fuel log belongs to user's company
        const existing = await prisma.fuelLog.findUnique({
            where: { id },
            include: { vehicle: { select: { companyId: true } } }
        });

        if (!existing || existing.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Fuel log not found' });
        }

        await prisma.fuelLog.delete({ where: { id } });

        return res.json({ message: 'Fuel log deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete fuel log' });
    }
};

// GET /api/fuel/stats/monthly-trend
export const getMonthlyFuelTrend = async (req: AuthRequest, res: Response) => {
    try {
        const { months = '12' } = req.query;
        const companyId = req.user!.companyId;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Number(months));

        const logs = await prisma.fuelLog.findMany({
            where: {
                vehicle: { companyId },
                date: { gte: startDate }
            },
            select: { date: true, cost: true, litres: true }
        });

        // Group by month
        const monthlyData: Record<string, { cost: number; litres: number }> = {};
        logs.forEach(log => {
            const month = log.date.toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { cost: 0, litres: 0 };
            }
            monthlyData[month].cost += log.cost;
            monthlyData[month].litres += log.litres;
        });

        const trend = Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return res.json({ trend });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch fuel trend' });
    }
};
