import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { VehicleStatus } from '@prisma/client';

// GET /api/vehicles
export const getVehicles = async (req: Request, res: Response) => {
    try {
        const { status, type, search, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (search) where.OR = [
            { name: { contains: String(search), mode: 'insensitive' } },
            { licensePlate: { contains: String(search), mode: 'insensitive' } },
        ];

        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { trips: true, maintenanceLogs: true } },
                },
            }),
            prisma.vehicle.count({ where }),
        ]);

        return res.json({ vehicles, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

// GET /api/vehicles/:id
export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id as string },
            include: {
                maintenanceLogs: { orderBy: { date: 'desc' }, take: 10 },
                fuelLogs: { orderBy: { date: 'desc' }, take: 10 },
                trips: { orderBy: { createdAt: 'desc' }, take: 5, include: { driver: { select: { name: true } } } },
                expenses: { orderBy: { date: 'desc' }, take: 10 },
            },
        });
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        return res.json(vehicle);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
};

// POST /api/vehicles
export const createVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const { name, model, licensePlate, type, maxCapacityKg, odometerKm } = req.body;
        if (!name || !licensePlate || !type || !maxCapacityKg) {
            return res.status(400).json({ error: 'name, licensePlate, type, maxCapacityKg are required' });
        }
        const companyId = req.user!.companyId;

        const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
        if (existing) return res.status(409).json({ error: 'License plate already exists' });

        const vehicle = await prisma.vehicle.create({
            data: {
                name,
                model: model || null,
                licensePlate,
                type,
                maxCapacityKg: Number(maxCapacityKg),
                odometerKm: Number(odometerKm) || 0,
                companyId,
            },
        });
        return res.status(201).json(vehicle);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create vehicle' });
    }
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req: Request, res: Response) => {
    try {
        const { name, model, licensePlate, type, maxCapacityKg, odometerKm } = req.body;
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id as string },
            data: {
                ...(name && { name }),
                ...(model !== undefined && { model }),
                ...(licensePlate && { licensePlate }),
                ...(type && { type }),
                ...(maxCapacityKg !== undefined && { maxCapacityKg: Number(maxCapacityKg) }),
                ...(odometerKm !== undefined && { odometerKm: Number(odometerKm) }),
            },
        });
        return res.json(vehicle);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update vehicle' });
    }
};

// PUT /api/vehicles/:id/status
export const updateVehicleStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!Object.values(VehicleStatus).includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(VehicleStatus).join(', ')}` });
        }
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id as string },
            data: { status },
        });
        return res.json(vehicle);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update status' });
    }
};

// DELETE /api/vehicles/:id  (soft delete → RETIRED)
export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id as string },
            data: { status: 'RETIRED' },
        });
        return res.json({ message: 'Vehicle retired', vehicle });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to retire vehicle' });
    }
};
