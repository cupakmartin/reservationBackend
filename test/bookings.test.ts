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

// Mock fetch for mailing service
const mockFetch = vi.fn()
global.fetch = mockFetch as any

beforeEach(() => {
    // Reset fetch mock and setup default successful response
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: 'test-message-id', previewUrl: 'https://test.ethereal.email' })
    })
})

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
        it('should return all seeded bookings for admin', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(5) // 5 seeded bookings
        })

        it('should return 403 for worker', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(403)
        })
    })

    describe('POST /api/bookings', () => {
        it('should create a new booking with valid data and calculate finalPrice', async () => {
            const bookingData = {
                clientId: seededData.clients.client1._id.toString(),
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id.toString(),
                startsAt: '2025-12-22T14:00:00Z', // Monday
                endsAt: '2025-12-22T15:00:00Z',
                status: 'confirmed',
                paymentType: 'card'
            }

            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send(bookingData)

            expect(res.status).toBe(201)
            expect(res.body.clientId).toBe(bookingData.clientId)
            expect(res.body.workerId).toBe(bookingData.workerId)
            expect(res.body.finalPrice).toBeDefined()
            expect(res.body.finalPrice).toBe(120 * 0.95) // Bronze tier 5% discount
            expect(res.body._id).toBeDefined()
        })

        it('should fail when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ workerId: seededData.clients.worker._id.toString() })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail with invalid status', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    workerId: seededData.clients.worker._id.toString(),
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
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
                    startsAt: '2025-12-15T14:00:00Z',
                    endsAt: '2025-12-15T15:00:00Z',
                    status: 'confirmed',
                    paymentType: 'bitcoin'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when booking on weekend (Saturday)', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
                    startsAt: '2025-12-20T14:00:00Z', // Saturday
                    endsAt: '2025-12-20T15:00:00Z',
                    status: 'confirmed',
                    paymentType: 'card'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when booking on weekend (Sunday)', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
                    startsAt: '2025-12-21T14:00:00Z', // Sunday
                    endsAt: '2025-12-21T15:00:00Z',
                    status: 'confirmed',
                    paymentType: 'card'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when booking before 08:00', async () => {
            // Create date in local timezone at 7 AM (before allowed hours)
            const startDate = new Date('2025-12-22')
            startDate.setHours(7, 0, 0, 0)
            const endDate = new Date('2025-12-22')
            endDate.setHours(8, 0, 0, 0)
            
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
                    startsAt: startDate.toISOString(),
                    endsAt: endDate.toISOString(),
                    status: 'confirmed',
                    paymentType: 'card'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when booking after 20:00', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({
                    clientId: seededData.clients.client1._id.toString(),
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id.toString(),
                    startsAt: '2025-12-22T20:00:00Z', // Monday, 8:00 PM
                    endsAt: '2025-12-22T21:00:00Z', // Ends at 9:00 PM
                    status: 'confirmed',
                    paymentType: 'card'
                })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })
    })

    describe('PATCH /api/bookings/:id/status/:newStatus', () => {
        it('should update booking status', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
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
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id, // Has BOM with materials
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
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
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(3)
            expect(updatedClient?.loyaltyTier).toBeNull()
        })

        it('should upgrade loyalty tier from Bronze to Silver', async () => {
            const loyaltyClient = await Client.create({
                name: 'Silver Client',
                email: 'silver@test.com',
                visitsCount: 24,
                loyaltyTier: 'Bronze'
            })

            const booking = await Booking.create({
                clientId: loyaltyClient._id,
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(25)
            expect(updatedClient?.loyaltyTier).toBe('Silver')
        })

        it('should upgrade loyalty tier to Gold', async () => {
            const loyaltyClient = await Client.create({
                name: 'Gold Client',
                email: 'gold@test.com',
                visitsCount: 49,
                loyaltyTier: 'Silver'
            })

            const booking = await Booking.create({
                clientId: loyaltyClient._id,
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
            })

            await request(app)
                .patch(`/api/bookings/${booking._id}/status/fulfilled`)
                .set('Authorization', `Bearer ${workerToken}`)

            const updatedClient = await Client.findById(loyaltyClient._id)
            expect(updatedClient?.visitsCount).toBe(50)
            expect(updatedClient?.loyaltyTier).toBe('Gold')
        })
    })

    describe('GET /api/bookings/:id', () => {
        it('should return booking by id', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
            })

            const res = await request(app)
                .get(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body.workerId).toBe(seededData.clients.worker._id.toString())
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
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'held',
                paymentType: 'cash',
                finalPrice: 120
            })

            const res = await request(app)
                .put(`/api/bookings/${booking._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ 
                    workerId: seededData.clients.worker._id.toString(),
                    status: 'confirmed'
                })

            expect(res.status).toBe(200)
            expect(res.body.workerId).toBe(seededData.clients.worker._id.toString())
            expect(res.body.status).toBe('confirmed')
        })

        it('should return 404 for non-existent booking', async () => {
            const res = await request(app)
                .put('/api/bookings/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${workerToken}`)
                .send({ workerId: seededData.clients.worker._id.toString() })
            
            expect(res.status).toBe(404)
        })

        it('should not allow updating status to invalid value', async () => {
            const booking = await Booking.create({
                clientId: seededData.clients.client1._id,
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
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
                workerId: seededData.clients.worker._id.toString(),
                procedureId: seededData.procedures.facialTreatment._id,
                startsAt: new Date('2025-12-15T14:00:00Z'),
                endsAt: new Date('2025-12-15T15:00:00Z'),
                status: 'confirmed',
                paymentType: 'card',
                finalPrice: 120
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
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-09T10:00:00Z'),
                    endsAt: new Date('2025-05-09T11:00:00Z'),
                    status: 'confirmed',
                    paymentType: 'card',
                    finalPrice: 120
                },
                {
                    clientId: seededData.clients.client1._id,
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-12T14:00:00Z'),
                    endsAt: new Date('2025-05-12T15:00:00Z'),
                    status: 'held',
                    paymentType: 'cash',
                    finalPrice: 120
                },
                {
                    clientId: seededData.clients.client1._id,
                    workerId: seededData.clients.worker._id.toString(),
                    procedureId: seededData.procedures.facialTreatment._id,
                    startsAt: new Date('2025-05-25T09:00:00Z'),
                    endsAt: new Date('2025-05-25T10:00:00Z'),
                    status: 'confirmed',
                    paymentType: 'card',
                    finalPrice: 120
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
