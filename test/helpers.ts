import { beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { Client } from '../src/database/models/client.model'
import { Material } from '../src/database/models/material.model'
import { Procedure } from '../src/database/models/procedure.model'
import { Booking } from '../src/database/models/booking.model'
import { createApp } from '../src/app'
import { seedTestData, seedMinimalData, type SeededData } from './seeders'

const app = createApp()

// Store seeded data for access in tests
let seededData: SeededData | null = null

export async function clearDatabase() {
    await Promise.all([
        Client.deleteMany({}),
        Material.deleteMany({}),
        Procedure.deleteMany({}),
        Booking.deleteMany({})
    ])
    seededData = null
}

/**
 * Get the seeded data created by useSeeders()
 * Must be called after useSeeders() hook runs
 */
export function getSeededData(): SeededData {
    if (!seededData) {
        throw new Error('No seeded data available. Did you call useSeeders() in your test?')
    }
    return seededData
}

/**
 * Seed minimal test data (client, material, procedure)
 * Returns the created entities for direct use
 */
export async function seedMinimal() {
    return await seedMinimalData()
}

/**
 * Seed full test data and store it for access via getSeededData()
 */
export async function seedFull() {
    seededData = await seedTestData()
    return seededData
}

export async function getAdminToken(): Promise<string> {
    // Use seeded admin user
    const res = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'admin@test.com',
            password: 'password123'
        })
    
    return res.body.accessToken
}

export async function getWorkerToken(): Promise<string> {
    // Use seeded worker user
    const res = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'worker@test.com',
            password: 'password123'
        })
    
    return res.body.accessToken
}

export async function getClientToken(): Promise<string> {
    // Use seeded client user (client1)
    const res = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'john@test.com',
            password: 'password123'
        })
    
    return res.body.accessToken
}

export async function seedBaselineData() {
    // Optional: Seed baseline data for specific tests that need it
    // Most tests create their own data, so this is typically not needed
    // Tests can call this function explicitly if they need baseline data
}

/**
 * Seeds only the authentication users (admin, worker, client)
 * This is needed for token generation in tests
 */
export async function seedAuthUsers() {
    const bcrypt = (await import('bcryptjs')).default
    const hashedPassword = await bcrypt.hash('password123', 10)

    await Client.create([
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
            role: 'worker'
        },
        {
            name: 'John Doe',
            email: 'john@test.com',
            password: hashedPassword,
            phone: '+1234567892',
            role: 'client',
            visitsCount: 0,
            loyaltyTier: 'None'
        }
    ])
}

/**
 * Default test hooks - clears database before each test
 * Use this for tests that create their own data
 */
export function setupTestHooks() {
    beforeEach(async () => {
        await clearDatabase()
    })
    
    afterEach(async () => {
        await clearDatabase()
    })
}

/**
 * Test hooks with full seeder - seeds comprehensive data before each test
 * Use this for tests that need realistic data sets
 * Access data via getSeededData()
 */
export function useSeeders() {
    beforeEach(async () => {
        await clearDatabase()
        await seedFull()
    })
    
    afterEach(async () => {
        await clearDatabase()
    })
}

/**
 * Test hooks with minimal seeder - seeds basic entities before each test
 * Returns data directly in the hook
 */
export function useMinimalSeeders() {
    let data: any
    
    beforeEach(async () => {
        await clearDatabase()
        data = await seedMinimal()
    })
    
    afterEach(async () => {
        await clearDatabase()
    })
    
    return () => data
}
