import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { setupTestHooks } from './helpers'
import { Client } from '../src/database/models/client.model'

const app = createApp()
setupTestHooks()

describe('Client API', () => {
    describe('GET /api/clients', () => {
        it('should return empty array when no clients', async () => {
            const res = await request(app).get('/api/clients')
            expect(res.status).toBe(200)
            expect(res.body).toEqual([])
        })

        it('should return all clients sorted by name', async () => {
            await Client.create([
                { name: 'Zoe', email: 'zoe@test.com', phone: '111' },
                { name: 'Alice', email: 'alice@test.com', phone: '222' }
            ])

            const res = await request(app).get('/api/clients')
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(2)
            expect(res.body[0].name).toBe('Alice')
            expect(res.body[1].name).toBe('Zoe')
        })
    })

    describe('POST /api/clients', () => {
        it('should create a new client with valid data', async () => {
            const clientData = {
                name: 'John Doe',
                email: 'john@test.com',
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
            const client = await Client.create({
                name: 'Original Name',
                email: 'original@test.com'
            })

            const res = await request(app)
                .put(`/api/clients/${client._id}`)
                .send({ name: 'Updated Name' })

            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Updated Name')
            expect(res.body.email).toBe('original@test.com')
        })

        it('should return 404 for non-existent client', async () => {
            const res = await request(app)
                .put('/api/clients/507f1f77bcf86cd799439011')
                .send({ name: 'Test' })

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Client not found')
        })

        it('should fail with invalid email', async () => {
            const client = await Client.create({ name: 'Test' })

            const res = await request(app)
                .put(`/api/clients/${client._id}`)
                .send({ email: 'bad-email' })

            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /api/clients/:id', () => {
        it('should delete an existing client', async () => {
            const client = await Client.create({
                name: 'To Delete',
                email: 'delete@test.com'
            })

            const res = await request(app)
                .delete(`/api/clients/${client._id}`)

            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const found = await Client.findById(client._id)
            expect(found).toBeNull()
        })

        it('should return 404 for non-existent client', async () => {
            const res = await request(app)
                .delete('/api/clients/507f1f77bcf86cd799439011')

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Client not found')
        })
    })
})
