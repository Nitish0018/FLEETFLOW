import { prisma } from '../lib/prisma';
import redis from '../lib/redis';
import { Request, Response } from 'express';

// GET /api/dashboard/summary
export const getDashboardSummary = async (req: Request, res: Response) => {
    try {
        const cacheKey = `dashboard:summary`;
        const cached = await redis.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));

        const [
            totalVehicles,
            activeFleet,
            inShop,
            totalDrivers,
            activeDrivers,
            pendingCargo,
            activeCargo,
            recentAlerts,
        ] = await Promise.all([
            prisma.vehicle.count(),
            prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
            prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
            prisma.driver.count(),
            prisma.driver.count({ where: { status: 'ON_DUTY' } }),
            prisma.trip.count({ where: { status: 'DRAFT' } }),
            prisma.trip.count({ where: { status: 'DISPATCHED' } }),
            prisma.alert.count({ where: { isRead: false } }),
        ]);

        const availableVehicles = await prisma.vehicle.count({ where: { status: 'AVAILABLE' } });
        const utilizationRate = totalVehicles > 0
            ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100)
            : 0;

        // Monthly fuel spend
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const fuelThisMonth = await prisma.fuelLog.aggregate({
            _sum: { cost: true },
            where: { date: { gte: startOfMonth } },
        });

        // Monthly maintenance cost
        const maintenanceThisMonth = await prisma.maintenanceLog.aggregate({
            _sum: { cost: true },
            where: { date: { gte: startOfMonth }, status: 'OPEN' },
        });

        const summary = {
            totalVehicles,
            activeFleet,
            inShop,
            availableVehicles,
            utilizationRate,
            totalDrivers,
            activeDrivers,
            pendingCargo,
            activeCargo,
            unreadAlerts: recentAlerts,
            fuelSpendThisMonth: fuelThisMonth._sum.cost ?? 0,
            maintenanceCostThisMonth: maintenanceThisMonth._sum.cost ?? 0,
        };

        await redis.set(cacheKey, JSON.stringify(summary), 'EX', 60);
        return res.json(summary);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
};

// GET /api/dashboard/monthly-fuel  (last 6 months)
export const getMonthlyFuel = async (_req: Request, res: Response) => {
    try {
        const cacheKey = 'dashboard:monthly-fuel';
        const cached = await redis.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const result = await prisma.fuelLog.aggregate({
                _sum: { cost: true, litres: true },
                where: { date: { gte: start, lte: end } },
            });

            months.push({
                month: start.toLocaleString('default', { month: 'short' }),
                year: start.getFullYear(),
                cost: result._sum.cost ?? 0,
                litres: result._sum.litres ?? 0,
            });
        }

        await redis.set(cacheKey, JSON.stringify(months), 'EX', 300);
        return res.json(months);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch monthly fuel data' });
    }
};

// GET /api/dashboard/vehicle-status (for pie chart)
export const getVehicleStatusBreakdown = async (_req: Request, res: Response) => {
    try {
        const statuses = await prisma.vehicle.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const result = statuses.map(s => ({
            status: s.status,
            count: s._count.id,
        }));

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch vehicle status data' });
    }
};
