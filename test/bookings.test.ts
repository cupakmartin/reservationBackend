import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { setupTestHooks } from './helpers'
import { Booking } from '../src/database/models/booking.model'
import { Client } from '../src/database/models/client.model'
import { Procedure } from '../src/database/models/procedure.model'
import { Material } from '../src/database/models/material.model'
import * as notificationService from '../src/services/notification.service'

const app = createApp()
setupTestHooks()

// Mock email sending
vi.mock('../src/services/notification.service', () => ({
    sendEmail: vi.fn()
}))

describe('Booking API', () => {
    let client: any
    let procedure: any
    let material: any

    beforeEach(async () => {
        client = await Client.create({
            name: 'Test Client',
            email: 'test@test.com',
            phone: '123456'
        })

        material = await Material.create({
            name: 'Test Material',
            unit: 'ml',
            stockOnHand: 100
        })

        procedure = await Procedure.create({
            name: 'Test Procedure',
            durationMin: 60,
            price: 50,
            bom: [{ materialId: material._id, qtyPerProcedure: 10 }]
        })
    })

    describe('GET /api/bookings', () => {
        it('should return empty array when no bookings', async () => {
            const res = await request(app).get('/api/bookings')
            expect(res.status).toBe(200)
            expect(res.body).toEqual([])
        })

        it('should return bookings sorted by creation date', async () => {
            await Booking.create([
                {
                    clientId: client._id,
                    providerName: 'Provider A',
                    procedureId: procedure._id,
                    startsAt: new Date('2025-12-01T10:00:00Z'),
                    endsAt: new Date('2025-12-01T11:00:00Z'),
                    status: 'confirmed',
                    paymentType: 'card'
                },
                {
                    clientId: client._id,
                    providerName: 'Provider B',
                    procedureId: procedure._id,
                    startsAt: new Date('2025-12-02T10:00:00Z'),
                    endsAt: new Date('2025-12-02T11:00:00Z'),
                    status: 'held',
                    paymentType: 'cash'
                }
            ])

            const res = await request(app).get('/api/bookings')
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(2)
        })
    })

    describe('POST /api/bookings', () => {
        it('should create a new booking with valid data', async () => {
            const bookingData = {
                clientId: client._id.toString(),
                providerName: 'Dr. Smith',
                procedureId: procedure._id.toString(),
                startsAt: '2025-12-15T14:00:00Z',
                endsAt: '2025-12-15T15:00:00Z',
                status: 'confirmed',
                paymentType: 'card'
            }

            const res = await request(app)
                .post('/api/bookings')
                .send(bookingData)

            expect(res.status).toBe(201)
            expect(res.body.clientId).toBe(bookingData.clientId)
            expect(res.body.providerName).toBe(bookingData.providerName)
            expect(res.body._id).toBeDefined()
        })

        it('should fail when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({ providerName: 'Test' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail with invalid status', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({
                    clientId: client._id.toString(),
                    providerName: 'Test',
                    procedureId: procedure._id.toString(),
                    startsAt: '2025-12-15T14:00:00Z',
                    endsAt: '2025-12-15T15:00:00Z',
                    status: 'invalid_status',
                    paymentType: 'card'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail with invalid paymentType', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({
                    clientId: client._id.toString(),
                    providerName: 'Test',
                    procedureId: procedure._id.toString(),
                    startsAt: '2025-12-15T14:00:00Z',
                    endsAt: '2025-12-15T15:00:00Z',
                    status: 'confirmed',
                    paymentType: 'bitcoin'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })
    })

    describe('PATCH /api/bookings/:id/status/:newStatus', () => {
        it('should update booking status', async () => {
            const booking = await Booking.create({
                clientId: client._id,
                providerName: 'Test Provider',
                procedureId: procedure._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const res = await request(app)
                .patch(`/api/bookings/${booking._id}/status/cancelled`)

            expect(res.status).toBe(200)
            expect(res.body.status).toBe('cancelled')
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .patch('/api/bookings/507f1f77bcf86cd799439011/status/cancelled')

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Booking not found')
        })

        it('should deduct material stock when status is fulfilled', async () => {
            const booking = await Booking.create({
                clientId: client._id,
                providerName: 'Test Provider',
                procedureId: procedure._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const initialStock = material.stockOnHand

            const res = await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)

            expect(res.status).toBe(200)
            expect(res.body.status).toBe('fulfilled')

            const updatedMaterial = await Material.findById(material._id)
            expect(updatedMaterial?.stockOnHand).toBe(initialStock - 10)
        })

        it('should apply loyalty tier when booking is fulfilled', async () => {
            // Create client with 2 visits already
            const loyaltyClient = await Client.create({
                name: 'Loyalty Client',
                email: 'loyalty@test.com',
                visitsCount: 2
            })

            const booking = await Booking.create({
                clientId: loyaltyClient._id,
                providerName: 'Test Provider',
                procedureId: procedure._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(3)
            expect(updatedClient?.loyaltyTier).toBe('Bronze')
        })

        it('should upgrade loyalty tier from Bronze to Silver', async () => {
            const loyaltyClient = await Client.create({
                name: 'Silver Client',
                email: 'silver@test.com',
                visitsCount: 7,
                loyaltyTier: 'Bronze'
            })

            const booking = await Booking.create({
                clientId: loyaltyClient._id,
                providerName: 'Test Provider',
                procedureId: procedure._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(8)
            expect(updatedClient?.loyaltyTier).toBe('Silver')
        })

        it('should upgrade loyalty tier to Gold', async () => {
            const loyaltyClient = await Client.create({
                name: 'Gold Client',
                email: 'gold@test.com',
                visitsCount: 14,
                loyaltyTier: 'Silver'
            })

            const booking = await Booking.create({
                clientId: loyaltyClient._id,
                providerName: 'Test Provider',
                procedureId: procedure._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(15)
            expect(updatedClient?.loyaltyTier).toBe('Gold')
        })
    })
})
