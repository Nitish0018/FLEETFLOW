import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DriverStatus } from '@prisma/client';

// GET /api/drivers
export const getDrivers = async (req: Request, res: Response) => {
    try {
        const { status, licenseCategory, search, available, page = '1', limit = '50' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (licenseCategory) where.licenseCategory = licenseCategory;
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { licenseNumber: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        // For trip form: only show OFF_DUTY drivers with valid licenses
        if (available === 'true') {
            where.status = DriverStatus.OFF_DUTY;
            where.licenseExpiry = { gte: new Date() };
        }

        const [drivers, total] = await Promise.all([
            prisma.driver.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { trips: true } },
                },
            }),
            prisma.driver.count({ where }),
        ]);

        return res.json({ drivers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};

// GET /api/drivers/:id
export const getDriverById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                trips: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { vehicle: { select: { name: true, licensePlate: true } } },
                },
                alerts: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
        });
        if (!driver) return res.status(404).json({ error: 'Driver not found' });
        return res.json(driver);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch driver' });
    }
};

// POST /api/drivers
export const createDriver = async (req: AuthRequest, res: Response) => {
    try {
        const { name, licenseNumber, licenseExpiry, licenseCategory, insuranceDetails, medicalClearance } = req.body;

        if (!name || !licenseNumber || !licenseExpiry || !licenseCategory) {
            return res.status(400).json({ error: 'name, licenseNumber, licenseExpiry, licenseCategory are required' });
        }

        const companyId = req.user!.companyId;

        const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
        if (existing) return res.status(409).json({ error: 'License number already registered' });

        const driver = await prisma.driver.create({
            data: {
                name,
                licenseNumber,
                licenseExpiry: new Date(licenseExpiry),
                licenseCategory,
                insuranceDetails: insuranceDetails || null,
                medicalClearance: medicalClearance ?? false,
                companyId,
            },
        });

        return res.status(201).json(driver);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create driver' });
    }
};

// PUT /api/drivers/:id
export const updateDriver = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { name, licenseNumber, licenseExpiry, licenseCategory, insuranceDetails, medicalClearance } = req.body;

        const driver = await prisma.driver.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(licenseNumber && { licenseNumber }),
                ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
                ...(licenseCategory && { licenseCategory }),
                ...(insuranceDetails !== undefined && { insuranceDetails }),
                ...(medicalClearance !== undefined && { medicalClearance }),
            },
        });

        return res.json(driver);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update driver' });
    }
};

// PUT /api/drivers/:id/status
export const updateDriverStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        if (!Object.values(DriverStatus).includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(DriverStatus).join(', ')}` });
        }

        const driver = await prisma.driver.update({
            where: { id },
            data: { status },
        });

        return res.json(driver);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update driver status' });
    }
};
