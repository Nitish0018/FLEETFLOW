import { PrismaClient, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus, MaintenanceType, MaintenanceStatus, ExpenseCategory } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const companyId = 'fleetflow-demo';

    // --- Test User for Authentication ---
    const testUserPasswordHash = await bcrypt.hash('admin123', 12);
    const testUser = await prisma.user.upsert({
        where: { email: 'admin@fleetflow.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@fleetflow.com',
            passwordHash: testUserPasswordHash,
            role: 'SUPER_ADMIN',
            companyId,
        },
    });

    // --- Vehicles (Sequential to avoid connection pool exhaustion) ---
    const van1 = await prisma.vehicle.upsert({
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
    });

    const van2 = await prisma.vehicle.upsert({
        where: { licensePlate: 'MH01AA1002' },
        update: {},
        create: {
            name: 'Van-02',
            model: 'Maruti Eeco',
            licensePlate: 'MH01AA1002',
            type: VehicleType.VAN,
            maxCapacityKg: 750,
            odometerKm: 8900,
            status: VehicleStatus.AVAILABLE,
            companyId,
        },
    });

    const truck1 = await prisma.vehicle.upsert({
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
    });

    const truck2 = await prisma.vehicle.upsert({
        where: { licensePlate: 'MH01TRK5002' },
        update: {},
        create: {
            name: 'Truck-06',
            model: 'Tata 1918',
            licensePlate: 'MH01TRK5002',
            type: VehicleType.TRUCK,
            maxCapacityKg: 4500,
            odometerKm: 65200,
            status: VehicleStatus.AVAILABLE,
            companyId,
        },
    });

    const bike1 = await prisma.vehicle.upsert({
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
    });

    const bike2 = await prisma.vehicle.upsert({
        where: { licensePlate: 'MH01BK9002' },
        update: {},
        create: {
            name: 'Bike-10',
            model: 'Honda CB Shine',
            licensePlate: 'MH01BK9002',
            type: VehicleType.BIKE,
            maxCapacityKg: 70,
            odometerKm: 12800,
            status: VehicleStatus.AVAILABLE,
            companyId,
        },
    });

    // --- Drivers (Sequential) ---
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const driver1 = await prisma.driver.upsert({
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
    });

    const driver2 = await prisma.driver.upsert({
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
    });

    const driver3 = await prisma.driver.upsert({
        where: { licenseNumber: 'DRV-TRK-002' },
        update: {},
        create: {
            name: 'Rajesh Kumar',
            licenseNumber: 'DRV-TRK-002',
            licenseExpiry: nextYear,
            licenseCategory: LicenseCategory.TRUCK,
            insuranceDetails: 'New India Assurance',
            medicalClearance: true,
            status: DriverStatus.OFF_DUTY,
            safetyScore: 85,
            tripCompletionRate: 0.93,
            companyId,
        },
    });

    const driver4 = await prisma.driver.upsert({
        where: { licenseNumber: 'DRV-VAN-008' },
        update: {},
        create: {
            name: 'Ananya Singh',
            licenseNumber: 'DRV-VAN-008',
            licenseExpiry: nextYear,
            licenseCategory: LicenseCategory.VAN,
            insuranceDetails: 'SBI General Insurance',
            medicalClearance: true,
            status: DriverStatus.OFF_DUTY,
            safetyScore: 94,
            tripCompletionRate: 0.99,
            companyId,
        },
    });

    const driver5 = await prisma.driver.upsert({
        where: { licenseNumber: 'DRV-BIKE-001' },
        update: {},
        create: {
            name: 'Vikram Desai',
            licenseNumber: 'DRV-BIKE-001',
            licenseExpiry: new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()),
            licenseCategory: LicenseCategory.BIKE,
            insuranceDetails: 'Bajaj Allianz',
            medicalClearance: true,
            status: DriverStatus.OFF_DUTY,
            safetyScore: 87,
            tripCompletionRate: 0.92,
            companyId,
        },
    });

    const driver6 = await prisma.driver.upsert({
        where: { licenseNumber: 'DRV-VAN-009' },
        update: {},
        create: {
            name: 'Neha Gupta',
            licenseNumber: 'DRV-VAN-009',
            licenseExpiry: nextYear,
            licenseCategory: LicenseCategory.VAN,
            insuranceDetails: 'HDFC Ergo - DriverCare',
            medicalClearance: true,
            status: DriverStatus.OFF_DUTY,
            safetyScore: 91,
            tripCompletionRate: 0.97,
            companyId,
        },
    });

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

    const trip3 = await prisma.trip.create({
        data: {
            vehicleId: van2.id,
            driverId: driver4.id,
            cargoWeightKg: 600,
            origin: 'Pune Hub',
            destination: 'Nashik Distribution Center',
            status: TripStatus.DISPATCHED,
            odometerStart: 8500,
            distanceKm: null,
            fuelConsumed: null,
        },
    });

    const trip4 = await prisma.trip.create({
        data: {
            vehicleId: truck2.id,
            driverId: driver3.id,
            cargoWeightKg: 3800,
            origin: 'Mumbai Port',
            destination: 'Delhi Distribution Hub',
            status: TripStatus.COMPLETED,
            odometerStart: 64500,
            odometerEnd: 65100,
            distanceKm: 600,
            fuelConsumed: 140,
            createdAt: lastMonth,
            completedAt: today,
        },
    });

    const trip5 = await prisma.trip.create({
        data: {
            vehicleId: bike2.id,
            driverId: driver5.id,
            cargoWeightKg: 45,
            origin: 'Dadar East',
            destination: 'Fort Mumbai',
            status: TripStatus.COMPLETED,
            odometerStart: 12400,
            odometerEnd: 12600,
            distanceKm: 200,
            fuelConsumed: 5,
            createdAt: lastMonth,
            completedAt: today,
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
            {
                vehicleId: van2.id,
                tripId: trip3.id,
                litres: 35,
                cost: 3850,
                date: today,
                createdAt: today,
            },
            {
                vehicleId: truck2.id,
                tripId: trip4.id,
                litres: 140,
                cost: 15400,
                date: lastMonth,
                createdAt: lastMonth,
            },
            {
                vehicleId: bike2.id,
                tripId: trip5.id,
                litres: 4,
                cost: 440,
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

    console.log('✅ Seed data inserted successfully!');
    console.log(`   - 1 Test User: admin@fleetflow.com (password: admin123)`);
    console.log(`   - 6 Vehicles (2 Vans, 2 Trucks, 2 Bikes)`);
    console.log(`   - 6 Drivers (Truck, Van, Bike licenses)`);
    console.log(`   - 5 Trips (mix of Completed and Dispatched)`);
    console.log(`   - 5 Fuel Logs (per trip and vehicle)`);
    console.log(`   - 2 Maintenance Logs`);
    console.log(`   - 2 Expenses`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
