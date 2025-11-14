import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { useSeeders, getAdminToken, getWorkerToken, getSeededData } from './helpers'
import { Booking } from '../src/database/models/booking.model'
import { Client } from '../src/database/models/client.model'
import { Procedure } from '../src/database/models/procedure.model'
import { Material } from '../src/database/models/material.model'

const app = createApp()
useSeeders()

// Mock mailing service
vi.mock('../src/services/mailing.service', () => ({
    sendEmail: vi.fn()
}))

// Mock WebSocket
vi.mock('../src/websocket', () => ({
    emitBookingUpdate: vi.fn(),
    initializeWebSocket: vi.fn(),
    getIO: vi.fn()
}))

describe('Booking API', () => {
    let adminToken: string
    let workerToken: string
    let seededData: any

    beforeEach(async () => {
        // Get fresh reference to seeded data and tokens for each test
        seededData = getSeededData()
        adminToken = await getAdminToken()
        workerToken = await getWorkerToken()
    })

    describe('GET /api/bookings', () => {
        it('should return all seeded bookings', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(5) // 5 seeded bookings
        })
    })

    describe('POST /api/bookings', () => {
        it('should create a new booking with valid data', async () => {
            const bookingData = {
                clientId: seededData.clients.client1._id.toString(),
                providerName: 'Dr. Smith',
                procedureId: seededData.procedures.facialTreatment._id.toString(),
                startsAt: '2025-12-25T14:00:00Z',
                endsAt: '2025-12-25T15:00:00Z',
                status: 'confirmed',
                paymentType: 'card'
            }

            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send(bookingData)

            expect(res.status).toBe(201)
            expect(res.body.clientId).toBe(bookingData.clientId)
            expect(res.body.providerName).toBe(bookingData.providerName)
            expect(res.body._id).toBeDefined()
        })

        it('should fail when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ providerName: 'Test' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail with invalid status', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    providerName: 'Test',
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
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
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    providerName: 'Test',
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
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
                clientId: seededData.clients.client1._id,
                providerName: 'Test Provider',
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const res = await request(app)
                .patch(`/api/bookings/${booking._id}/status/cancelled`)
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.status).toBe('cancelled')
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .patch('/api/bookings/507f1f77bcf86cd799439011/status/cancelled')
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Booking not found')
        })

        it('should deduct material stock when status is fulfilled', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                providerName: 'Test Provider',
                procedureId: seededData.procedures.facialTreatment._id, // Has BOM with materials
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const material = seededData.materials.hyaluronicAcid
            const initialStock = material.stockOnHand

            const res = await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.status).toBe('fulfilled')

            const updatedMaterial = await Material.findById(material._id)
            expect(updatedMaterial?.stockOnHand).toBe(initialStock - 10) // facialTreatment uses 10 units
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
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

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
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

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
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(15)
            expect(updatedClient?.loyaltyTier).toBe('Gold')
        })
    })

    describe('GET /api/bookings/:id', () => {
        it('should return booking by id', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                providerName: 'Test Provider',
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const res = await request(app)
                .get(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body.providerName).toBe('Test Provider')
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .get('/api/bookings/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Booking not found')
        })
    })

    describe('PUT /api/bookings/:id', () => {
        it('should update booking', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                providerName: 'Old Provider',
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'held',
                paymentType: 'cash'
            })

            const res = await request(app)
                .put(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ 
                    providerName: 'New Provider',
                    status: 'confirmed'
                })

            expect(res.status).toBe(200)
            expect(res.body.providerName).toBe('New Provider')
            expect(res.body.status).toBe('confirmed')
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .put('/api/bookings/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ providerName: 'New Provider' })
            
            expect(res.status).toBe(404)
        })

        it('should reject invalid status on update', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                providerName: 'Test Provider',
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const res = await request(app)
                .put(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ status: 'invalid' })

            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /api/bookings/:id', () => {
        it('should delete booking', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                providerName: 'To Delete',
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card'
            })

            const res = await request(app)
                .delete(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const check = await Booking.findById(booking._id)
            expect(check).toBeNull()
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .delete('/api/bookings/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(404)
        })
    })

    describe('GET /api/bookings/calendar', () => {
        it('should return calendar data for a specific month', async () => {
            // Create bookings for May 2025
            await Booking.create([
                {
                    clientId: seededData.clients.client1._id,
                    providerName: 'Test Provider',
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-09T10:00:00Z'),
                    endsAt: new Date('2025-05-09T11:00:00Z'),
                    status: 'confirmed',
                    paymentType: 'card'
                },
                {
                    clientId: seededData.clients.client1._id,
                    providerName: 'Test Provider',
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-12T14:00:00Z'),
                    endsAt: new Date('2025-05-12T15:00:00Z'),
                    status: 'held',
                    paymentType: 'cash'
                },
                {
                    clientId: seededData.clients.client1._id,
                    providerName: 'Test Provider',
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-25T09:00:00Z'),
                    endsAt: new Date('2025-05-25T10:00:00Z'),
                    status: 'confirmed',
                    paymentType: 'card'
                }
            ])

            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ month: 5, year: 2025 })
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.month).toBe(5)
            expect(res.body.year).toBe(2025)
            expect(res.body.dates).toBeInstanceOf(Array)
            expect(res.body.dates).toContain('2025-05-09')
            expect(res.body.dates).toContain('2025-05-12')
            expect(res.body.dates).toContain('2025-05-25')
            expect(res.body.stats).toBeDefined()
        })

        it('should return empty dates for month with no bookings', async () => {
            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ month: 1, year: 2026 })
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.month).toBe(1)
            expect(res.body.year).toBe(2026)
            expect(res.body.dates).toEqual([])
        })

        it('should fail without month parameter', async () => {
            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ year: 2025 })
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Invalid parameters')
        })

        it('should fail without year parameter', async () => {
            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ month: 5 })
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Invalid parameters')
        })

        it('should fail with invalid month', async () => {
            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ month: 13, year: 2025 })
                .set('Authorization', `Bearer ${workerToken}`)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Invalid month')
        })

        it('should require authentication', async () => {
            const res = await request(app)
                .get('/api/bookings/calendar')
                .query({ month: 5, year: 2025 })

            expect(res.status).toBe(401)
        })
    })
})
