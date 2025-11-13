import { beforeEach } from 'vitest'
import { Client } from '../src/database/models/client.model'
import { Material } from '../src/database/models/material.model'
import { Procedure } from '../src/database/models/procedure.model'
import { Booking } from '../src/database/models/booking.model'

export async function clearDatabase() {
    await Promise.all([
        Client.deleteMany({}),
        Material.deleteMany({}),
        Procedure.deleteMany({}),
        Booking.deleteMany({})
    ])
}

export async function seedBaselineData() {
    // Optional: Seed baseline data for specific tests that need it
    // Most tests create their own data, so this is typically not needed
    // Tests can call this function explicitly if they need baseline data
}

export function setupTestHooks() {
    beforeEach(async () => {
        await clearDatabase()
        // Note: We don't seed baseline data by default
        // Tests should create their own data as needed
    })
}
