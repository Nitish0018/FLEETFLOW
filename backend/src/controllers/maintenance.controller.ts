import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MaintenanceType, MaintenanceStatus, VehicleStatus } from '@prisma/client';

// GET /api/maintenance
export const getMaintenanceLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, status, page = '1', limit = '50' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const companyId = req.user!.companyId;

        const where: Record<string, any> = { vehicle: { companyId } };
        if (vehicleId) where.vehicleId = String(vehicleId);
        if (status) where.status = status as MaintenanceStatus;

        const [logs, total] = await Promise.all([
            prisma.maintenanceLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { date: 'desc' },
                include: {
                    vehicle: { select: { name: true, licensePlate: true } },
                }
            }),
            prisma.maintenanceLog.count({ where })
        ]);

        return res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch maintenance logs' });
    }
};

// GET /api/maintenance/:id
export const getMaintenanceLogById = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const log = await prisma.maintenanceLog.findUnique({
            where: { id },
            include: { vehicle: { select: { name: true, licensePlate: true, status: true, companyId: true } } }
        });

        if (!log || log.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Maintenance log not found' });
        }

        return res.json(log);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch maintenance log' });
    }
};

// POST /api/maintenance
export const createMaintenanceLog = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, type, description, cost, date } = req.body;

        if (!vehicleId || !type || !description || !date) {
            return res.status(400).json({ error: 'vehicleId, type, description, and date are required' });
        }

        const companyId = req.user!.companyId;

        // Verify vehicle belongs to company
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle || vehicle.companyId !== companyId) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Create log and update vehicle status in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const newLog = await tx.maintenanceLog.create({
                data: {
                    vehicleId,
                    type: type as MaintenanceType,
                    description,
                    cost: cost ? Number(cost) : null,
                    date: new Date(date),
                    status: MaintenanceStatus.OPEN,
                },
                include: { vehicle: true }
            });

            // Auto-Logic: Set Vehicle.status -> "IN_SHOP"
            await tx.vehicle.update({
                where: { id: vehicleId },
                data: { status: VehicleStatus.IN_SHOP }
            });

            return newLog;
        });

        return res.status(201).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create maintenance log' });
    }
};

// PUT /api/maintenance/:id/resolve
export const resolveMaintenanceLog = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);

        const log = await prisma.maintenanceLog.findUnique({
            where: { id },
            include: { vehicle: true }
        });

        if (!log || log.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Maintenance log not found' });
        }

        if (log.status === MaintenanceStatus.RESOLVED) {
            return res.status(400).json({ error: 'Maintenance log is already resolved' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedLog = await tx.maintenanceLog.update({
                where: { id },
                data: { status: MaintenanceStatus.RESOLVED }
            });

            // Set Vehicle.status -> "AVAILABLE"
            await tx.vehicle.update({
                where: { id: log.vehicleId },
                data: { status: VehicleStatus.AVAILABLE }
            });

            return updatedLog;
        });

        return res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to resolve maintenance log' });
    }
};

// DELETE /api/maintenance/:id
export const deleteMaintenanceLog = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);

        const log = await prisma.maintenanceLog.findUnique({
            where: { id },
            include: { vehicle: true }
        });

        if (!log || log.vehicle.companyId !== req.user!.companyId) {
            return res.status(404).json({ error: 'Maintenance log not found' });
        }

        await prisma.maintenanceLog.delete({ where: { id } });

        // Note: we do not automatically set the vehicle to Available on delete 
        // because it could have other open maintenance logs, or the user deleted it by mistake.

        return res.json({ message: 'Maintenance log deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete maintenance log' });
    }
};
