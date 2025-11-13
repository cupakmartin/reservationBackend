import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { useSeeders, getAdminToken, getWorkerToken, getSeededData } from './helpers'
import { Client } from '../src/database/models/client.model'

const app = createApp()
useSeeders()

describe('Client API', () => {
    let adminToken: string
    let workerToken: string

    beforeEach(async () => {
        adminToken = await getAdminToken()
        workerToken = await getWorkerToken()
    })

    describe('GET /api/clients', () => {
        it('should return all seeded clients sorted by name', async () => {
            const res = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(5) // admin, worker, client1, client2, client3
            // First should be "Admin User" (alphabetically sorted)
            expect(res.body[0].name).toBe('Admin User')
            expect(res.body[1].name).toBe('Bob Johnson')
        })
    })

    describe('POST /api/clients', () => {
        it('should create a new client with valid data', async () => {
            const clientData = {
                name: 'New Client',
                email: 'newclient@test.com',
                phone: '123456789'
            }

            const res = await request(app)
                .post('/api/clients')
                .send(clientData)

            expect(res.status).toBe(201)
            expect(res.body.name).toBe(clientData.name)
            expect(res.body.email).toBe(clientData.email)
            expect(res.body._id).toBeDefined()
        })

        it('should fail when name is missing', async () => {
            const res = await request(app)
                .post('/api/clients')
                .send({ email: 'test@test.com' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when email is invalid', async () => {
            const res = await request(app)
                .post('/api/clients')
                .send({ name: 'Test', email: 'invalid-email' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should accept optional fields', async () => {
            const res = await request(app)
                .post('/api/clients')
                .send({ name: 'Minimal Client' })

            expect(res.status).toBe(201)
            expect(res.body.name).toBe('Minimal Client')
        })
    })

    describe('PUT /api/clients/:id', () => {
        it('should update client with valid data', async () => {
            const seeded = getSeededData()
            const client = seeded.clients.client1

            const res = await request(app)
                .put(`/api/clients/${client._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })

            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Updated Name')
            expect(res.body.email).toBe(client.email)
        })

        it('should return 404 for non-existent client', async () => {
            const res = await request(app)
                .put('/api/clients/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test' })

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Client not found')
        })

        it('should fail with invalid email', async () => {
            const seeded = getSeededData()
            const client = seeded.clients.client2

            const res = await request(app)
                .put(`/api/clients/${client._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'bad-email' })

            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /api/clients/:id', () => {
        it('should delete an existing client', async () => {
            const seeded = getSeededData()
            const client = seeded.clients.client3

            const res = await request(app)
                .delete(`/api/clients/${client._id}`)
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const found = await Client.findById(client._id)
            expect(found).toBeNull()
        })

        it('should return 404 for non-existent client', async () => {
            const res = await request(app)
                .delete('/api/clients/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Client not found')
        })
    })
})
