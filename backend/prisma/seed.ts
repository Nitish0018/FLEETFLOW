import { PrismaClient, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus, MaintenanceType, MaintenanceStatus, ExpenseCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companyId = 'fleetflow-demo';

    // --- Vehicles ---
    const [van1, truck1, bike1] = await Promise.all([
        prisma.vehicle.upsert({
            where: { licensePlate: 'MH01AA1001' },
            update: {},
            create: {
                name: 'Van-01',
                model: 'Tata Ace',
                licensePlate: 'MH01AA1001',
                type: VehicleType.VAN,
                maxCapacityKg: 800,
                odometerKm: 12500,
                status: VehicleStatus.AVAILABLE,
                companyId,
            },
        }),
        prisma.vehicle.upsert({
            where: { licensePlate: 'MH01TRK5001' },
            update: {},
            create: {
                name: 'Truck-05',
                model: 'Ashok Leyland 1618',
                licensePlate: 'MH01TRK5001',
                type: VehicleType.TRUCK,
                maxCapacityKg: 5000,
                odometerKm: 84500,
                status: VehicleStatus.IN_SHOP,
                companyId,
            },
        }),
        prisma.vehicle.upsert({
            where: { licensePlate: 'MH01BK9001' },
            update: {},
            create: {
                name: 'Bike-09',
                model: 'Hero Splendor',
                licensePlate: 'MH01BK9001',
                type: VehicleType.BIKE,
                maxCapacityKg: 60,
                odometerKm: 18200,
                status: VehicleStatus.ON_TRIP,
                companyId,
            },
        }),
    ]);

    // --- Drivers ---
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const [driver1, driver2] = await Promise.all([
        prisma.driver.upsert({
            where: { licenseNumber: 'DRV-TRK-001' },
            update: {},
            create: {
                name: 'Arjun Mehta',
                licenseNumber: 'DRV-TRK-001',
                licenseExpiry: nextYear,
                licenseCategory: LicenseCategory.TRUCK,
                insuranceDetails: 'ICICI Lombard - FleetCover',
                medicalClearance: true,
                status: DriverStatus.ON_DUTY,
                safetyScore: 92,
                tripCompletionRate: 0.96,
                companyId,
            },
        }),
        prisma.driver.upsert({
            where: { licenseNumber: 'DRV-VAN-007' },
            update: {},
            create: {
                name: 'Priya Nair',
                licenseNumber: 'DRV-VAN-007',
                licenseExpiry: nextYear,
                licenseCategory: LicenseCategory.VAN,
                insuranceDetails: 'HDFC Ergo - DriverCare',
                medicalClearance: true,
                status: DriverStatus.OFF_DUTY,
                safetyScore: 88,
                tripCompletionRate: 0.91,
                companyId,
            },
        }),
    ]);

    // --- Trips ---
    const trip1 = await prisma.trip.create({
        data: {
            vehicleId: van1.id,
            driverId: driver2.id,
            cargoWeightKg: 550,
            origin: 'Bhiwandi DC',
            destination: 'Mumbai South Hub',
            status: TripStatus.COMPLETED,
            odometerStart: 11800,
            odometerEnd: 12000,
            distanceKm: 200,
            fuelConsumed: 28,
            createdAt: lastMonth,
            completedAt: today,
        },
    });

    const trip2 = await prisma.trip.create({
        data: {
            vehicleId: bike1.id,
            driverId: driver1.id,
            cargoWeightKg: 25,
            origin: 'Andheri Hub',
            destination: 'Bandra West Cluster',
            status: TripStatus.DISPATCHED,
            odometerStart: 18120,
            distanceKm: null,
            fuelConsumed: null,
        },
    });

    // --- Fuel Logs ---
    await prisma.fuelLog.createMany({
        data: [
            {
                vehicleId: van1.id,
                tripId: trip1.id,
                litres: 30,
                cost: 3300,
                date: lastMonth,
                createdAt: lastMonth,
            },
            {
                vehicleId: truck1.id,
                tripId: null,
                litres: 80,
                cost: 9200,
                date: lastMonth,
                createdAt: lastMonth,
            },
        ],
        skipDuplicates: true,
    });

    // --- Maintenance Logs ---
    await prisma.maintenanceLog.createMany({
        data: [
            {
                vehicleId: truck1.id,
                type: MaintenanceType.SCHEDULED,
                description: 'Quarterly brake inspection and tyre rotation',
                cost: 8500,
                date: lastMonth,
                status: MaintenanceStatus.OPEN,
                createdAt: lastMonth,
                updatedAt: lastMonth,
            },
            {
                vehicleId: van1.id,
                type: MaintenanceType.URGENT,
                description: 'Engine oil leak fix',
                cost: 4200,
                date: lastMonth,
                status: MaintenanceStatus.RESOLVED,
                createdAt: lastMonth,
                updatedAt: today,
            },
        ],
        skipDuplicates: true,
    });

    // --- Expenses ---
    await prisma.expense.createMany({
        data: [
            {
                vehicleId: truck1.id,
                category: ExpenseCategory.INSURANCE,
                amount: 32000,
                description: 'Annual comprehensive insurance renewal',
                date: lastMonth,
                createdAt: lastMonth,
            },
            {
                vehicleId: van1.id,
                category: ExpenseCategory.MAINTENANCE,
                amount: 4500,
                description: 'Suspension bush replacement',
                date: today,
                createdAt: today,
            },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Seed data inserted for vehicles, drivers, trips, fuel, maintenance and expenses.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
