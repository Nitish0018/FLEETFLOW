import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

// GET /api/trips
export const getTrips = async (req: Request, res: Response) => {
    try {
        const { status, vehicleId, driverId, from, to, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (vehicleId) where.vehicleId = vehicleId;
        if (driverId) where.driverId = driverId;
        if (from || to) {
            where.createdAt = {
                ...(from && { gte: new Date(String(from)) }),
                ...(to && { lte: new Date(String(to)) }),
            };
        }

        const [trips, total] = await Promise.all([
            prisma.trip.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    vehicle: { select: { id: true, name: true, licensePlate: true, maxCapacityKg: true } },
                    driver: { select: { id: true, name: true, licenseNumber: true } },
                },
            }),
            prisma.trip.count({ where }),
        ]);

        return res.json({ trips, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch trips' });
    }
};

// GET /api/trips/:id
export const getTripById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: true,
                fuelLogs: { orderBy: { date: 'desc' } },
            },
        });
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        return res.json(trip);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch trip' });
    }
};

// POST /api/trips
export const createTrip = async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, driverId, cargoWeightKg, origin, destination } = req.body;

        if (!vehicleId || !driverId || !cargoWeightKg || !origin || !destination) {
            return res.status(400).json({ error: 'vehicleId, driverId, cargoWeightKg, origin, destination are required' });
        }

        // Fetch vehicle and driver
        const [vehicle, driver] = await Promise.all([
            prisma.vehicle.findUnique({ where: { id: vehicleId } }),
            prisma.driver.findUnique({ where: { id: driverId } }),
        ]);

        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        if (!driver) return res.status(404).json({ error: 'Driver not found' });

        // Validation Rule 1: Cargo weight vs capacity
        if (Number(cargoWeightKg) > vehicle.maxCapacityKg) {
            return res.status(400).json({
                error: `Cargo exceeds vehicle capacity. Max: ${vehicle.maxCapacityKg} kg, requested: ${cargoWeightKg} kg`,
            });
        }

        // Validation Rule 2: Driver license expiry
        if (new Date(driver.licenseExpiry) < new Date()) {
            return res.status(400).json({ error: 'Driver license expired. Cannot assign to trip.' });
        }

        // Validation Rule 3: Vehicle must be AVAILABLE
        if (vehicle.status !== VehicleStatus.AVAILABLE) {
            return res.status(400).json({ error: `Vehicle is not available. Current status: ${vehicle.status}` });
        }

        // Validation Rule 4: Driver must be OFF_DUTY
        if (driver.status !== DriverStatus.OFF_DUTY) {
            return res.status(400).json({ error: `Driver is not off duty. Current status: ${driver.status}` });
        }

        // Create trip as DRAFT – vehicle/driver status changes happen on dispatch
        const trip = await prisma.trip.create({
            data: {
                vehicleId,
                driverId,
                cargoWeightKg: Number(cargoWeightKg),
                origin,
                destination,
                status: TripStatus.DRAFT,
                odometerStart: vehicle.odometerKm,
            },
        });

        const fullTrip = await prisma.trip.findUnique({
            where: { id: trip.id },
            include: {
                vehicle: { select: { id: true, name: true, licensePlate: true } },
                driver: { select: { id: true, name: true } },
            },
        });

        return res.status(201).json(fullTrip);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create trip' });
    }
};

// PUT /api/trips/:id/complete
export const completeTrip = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { odometerEnd, fuelConsumed } = req.body;

        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true },
        });

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        if (trip.status === TripStatus.COMPLETED) {
            return res.status(400).json({ error: 'Trip is already completed' });
        }
        if (trip.status === TripStatus.CANCELLED) {
            return res.status(400).json({ error: 'Cannot complete a cancelled trip' });
        }

        const finalOdometer = odometerEnd ? Number(odometerEnd) : trip.odometerStart;
        const distanceKm = finalOdometer - trip.odometerStart;

        const updatedTrip = await prisma.$transaction(async (tx) => {
            const completed = await tx.trip.update({
                where: { id },
                data: {
                    status: TripStatus.COMPLETED,
                    odometerEnd: finalOdometer,
                    distanceKm: distanceKm > 0 ? distanceKm : 0,
                    fuelConsumed: fuelConsumed ? Number(fuelConsumed) : null,
                    completedAt: new Date(),
                },
            });

            // Restore vehicle status and update odometer
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: VehicleStatus.AVAILABLE,
                    odometerKm: finalOdometer,
                },
            });

            // Restore driver status and update completion rate
            const driverTrips = await tx.trip.count({
                where: { driverId: trip.driverId, status: TripStatus.COMPLETED },
            });
            const totalDriverTrips = await tx.trip.count({
                where: { driverId: trip.driverId },
            });
            const completionRate = totalDriverTrips > 0 ? (driverTrips / totalDriverTrips) * 100 : 0;

            await tx.driver.update({
                where: { id: trip.driverId },
                data: {
                    status: DriverStatus.OFF_DUTY,
                    tripCompletionRate: Math.round(completionRate * 100) / 100,
                },
            });

            return completed;
        });

        return res.json(updatedTrip);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to complete trip' });
    }
};

// PUT /api/trips/:id/cancel
export const cancelTrip = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true },
        });

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        if (trip.status === TripStatus.COMPLETED) {
            return res.status(400).json({ error: 'Cannot cancel a completed trip' });
        }
        if (trip.status === TripStatus.CANCELLED) {
            return res.status(400).json({ error: 'Trip is already cancelled' });
        }

        const updatedTrip = await prisma.$transaction(async (tx) => {
            const cancelled = await tx.trip.update({
                where: { id },
                data: { status: TripStatus.CANCELLED },
            });

            // Restore vehicle status
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: VehicleStatus.AVAILABLE },
            });

            // Restore driver status
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: DriverStatus.OFF_DUTY },
            });

            return cancelled;
        });

        return res.json(updatedTrip);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to cancel trip' });
    }
};

// PUT /api/trips/:id/dispatch
export const dispatchTrip = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true },
        });

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        if (trip.status !== TripStatus.DRAFT) {
            return res.status(400).json({ error: `Cannot dispatch a trip with status: ${trip.status}` });
        }

        const updatedTrip = await prisma.$transaction(async (tx) => {
            const dispatched = await tx.trip.update({
                where: { id },
                data: { status: TripStatus.DISPATCHED },
            });

            // Update vehicle status to ON_TRIP
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: VehicleStatus.ON_TRIP },
            });

            // Update driver status to ON_DUTY
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: DriverStatus.ON_DUTY },
            });

            return dispatched;
        });

        return res.json(updatedTrip);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to dispatch trip' });
    }
};
