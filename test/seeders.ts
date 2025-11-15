import { Client } from '../src/database/models/client.model'
import { Material } from '../src/database/models/material.model'
import { Procedure } from '../src/database/models/procedure.model'
import { Booking } from '../src/database/models/booking.model'
import bcrypt from 'bcryptjs'

/**
 * Test Seeder - Creates dummy data for testing
 * All data is automatically cleaned up by the test hooks after each test
 */

export interface SeededData {
    clients: {
        admin: any
        worker: any
        client1: any
        client2: any
        client3: any
    }
    materials: {
        hyaluronicAcid: any
        botox: any
        collagen: any
        vitaminC: any
    }
    procedures: {
        facialTreatment: any
        botoxInjection: any
        laserTherapy: any
        chemicalPeel: any
    }
    bookings: any[]
}

/**
 * Seeds the database with comprehensive test data
 * @returns SeededData object containing references to all created entities
 */
export async function seedTestData(): Promise<SeededData> {
    // Hash password once for reuse (faster than hashing 5 times)
    const hashedPassword = await bcrypt.hash('password123', 10)

    // 1. Seed Clients (including authenticated users)
    const [admin, worker, client1, client2, client3] = await Client.create([
        {
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            phone: '+1234567890',
            role: 'admin'
        },
        {
            name: 'Worker User',
            email: 'worker@test.com',
            password: hashedPassword,
            phone: '+1234567891',
            role: 'worker',
            loyaltyTier: 'Worker'
        },
        {
            name: 'John Doe',
            email: 'john@test.com',
            password: hashedPassword,
            phone: '+1234567892',
            role: 'client',
            loyaltyTier: 'Bronze',
            visitsCount: 12
        },
        {
            name: 'Jane Smith',
            email: 'jane@test.com',
            password: hashedPassword,
            phone: '+1234567893',
            role: 'client',
            loyaltyTier: 'Silver',
            visitsCount: 30
        },
        {
            name: 'Bob Johnson',
            email: 'bob@test.com',
            password: hashedPassword,
            phone: '+1234567894',
            role: 'client',
            loyaltyTier: 'Gold',
            visitsCount: 55
        }
    ])

    // 2. Seed Materials
    const [hyaluronicAcid, botox, collagen, vitaminC] = await Material.create([
        {
            name: 'Hyaluronic Acid',
            unit: 'ml',
            stockOnHand: 500,
            reorderLevel: 100
        },
        {
            name: 'Botox',
            unit: 'ml', // Changed from 'units' to 'ml'
            stockOnHand: 1000,
            reorderLevel: 200
        },
        {
            name: 'Collagen Serum',
            unit: 'ml',
            stockOnHand: 300,
            reorderLevel: 50
        },
        {
            name: 'Vitamin C Serum',
            unit: 'ml',
            stockOnHand: 250,
            reorderLevel: 50
        }
    ])

    // 3. Seed Procedures with BOM (Bill of Materials)
    const [facialTreatment, botoxInjection, laserTherapy, chemicalPeel] = await Procedure.create([
        {
            name: 'Hydrating Facial Treatment',
            durationMin: 60,
            price: 120,
            bom: [
                { materialId: hyaluronicAcid._id, qtyPerProcedure: 10 },
                { materialId: vitaminC._id, qtyPerProcedure: 5 }
            ]
        },
        {
            name: 'Botox Injection',
            durationMin: 30,
            price: 300,
            bom: [
                { materialId: botox._id, qtyPerProcedure: 20 }
            ]
        },
        {
            name: 'Laser Therapy Session',
            durationMin: 45,
            price: 200,
            bom: [] // No materials required
        },
        {
            name: 'Chemical Peel',
            durationMin: 90,
            price: 180,
            bom: [
                { materialId: collagen._id, qtyPerProcedure: 15 },
                { materialId: vitaminC._id, qtyPerProcedure: 10 }
            ]
        }
    ])

    // 4. Seed Bookings with various statuses
    const bookings = await Booking.create([
        {
            clientId: client1._id,
            workerId: worker._id,
            procedureId: facialTreatment._id,
            startsAt: new Date('2025-12-16T10:00:00Z'),
            endsAt: new Date('2025-12-16T11:00:00Z'),
            status: 'confirmed',
            paymentType: 'card',
            finalPrice: 120 * 0.95 // Bronze discount 5%
        },
        {
            clientId: client1._id,
            workerId: worker._id,
            procedureId: botoxInjection._id,
            startsAt: new Date('2025-12-17T14:00:00Z'),
            endsAt: new Date('2025-12-17T14:30:00Z'),
            status: 'held',
            paymentType: 'cash',
            finalPrice: 300 * 0.95 // Bronze discount 5%
        },
        {
            clientId: client2._id,
            workerId: worker._id,
            procedureId: laserTherapy._id,
            startsAt: new Date('2025-12-18T09:00:00Z'),
            endsAt: new Date('2025-12-18T09:45:00Z'),
            status: 'fulfilled',
            paymentType: 'card',
            finalPrice: 200 * 0.9 // Silver discount 10%
        },
        {
            clientId: client2._id,
            workerId: worker._id,
            procedureId: chemicalPeel._id,
            startsAt: new Date('2025-12-19T13:00:00Z'),
            endsAt: new Date('2025-12-19T14:30:00Z'),
            status: 'confirmed',
            paymentType: 'deposit',
            finalPrice: 180 * 0.9 // Silver discount 10%
        },
        {
            clientId: client3._id,
            workerId: worker._id,
            procedureId: facialTreatment._id,
            startsAt: new Date('2025-12-20T11:00:00Z'),
            endsAt: new Date('2025-12-20T12:00:00Z'),
            status: 'cancelled',
            paymentType: 'card',
            finalPrice: 120 * 0.8 // Gold discount 20%
        }
    ])

    return {
        clients: {
            admin,
            worker,
            client1,
            client2,
            client3
        },
        materials: {
            hyaluronicAcid,
            botox,
            collagen,
            vitaminC
        },
        procedures: {
            facialTreatment,
            botoxInjection,
            laserTherapy,
            chemicalPeel
        },
        bookings
    }
}

/**
 * Seeds minimal data - useful for tests that need just basic entities
 */
export async function seedMinimalData() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const client = await Client.create({
        name: 'Test Client',
        email: 'test@test.com',
        password: hashedPassword,
        phone: '123456',
        role: 'client'
    })

    const material = await Material.create({
        name: 'Test Material',
        unit: 'ml',
        stockOnHand: 100
    })

    const procedure = await Procedure.create({
        name: 'Test Procedure',
        durationMin: 60,
        price: 50,
        bom: [{ materialId: material._id, qtyPerProcedure: 10 }]
    })

    return { client, material, procedure }
}

/**
 * Seeds only clients with different roles
 */
export async function seedClients() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    return await Client.create([
        {
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
        },
        {
            name: 'Worker User',
            email: 'worker@test.com',
            password: hashedPassword,
            role: 'worker'
        },
        {
            name: 'Client User',
            email: 'client@test.com',
            password: hashedPassword,
            role: 'client'
        }
    ])
}

/**
 * Seeds only materials
 */
export async function seedMaterials() {
    return await Material.create([
        { name: 'Hyaluronic Acid', unit: 'ml', stockOnHand: 500 },
        { name: 'Botox', unit: 'ml', stockOnHand: 1000 },
        { name: 'Collagen Serum', unit: 'ml', stockOnHand: 300 }
    ])
}

/**
 * Seeds only procedures (requires materials to exist)
 */
export async function seedProcedures(materialIds: string[]) {
    return await Procedure.create([
        {
            name: 'Facial Treatment',
            durationMin: 60,
            price: 120,
            bom: materialIds.length > 0 ? [{ materialId: materialIds[0], qtyPerProcedure: 10 }] : []
        },
        {
            name: 'Botox Injection',
            durationMin: 30,
            price: 300,
            bom: materialIds.length > 1 ? [{ materialId: materialIds[1], qtyPerProcedure: 20 }] : []
        }
    ])
}
