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

export function setupTestHooks() {
    beforeEach(async () => {
        await clearDatabase()
    })
}
