import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { useSeeders, getAdminToken, getWorkerToken, getSeededData } from './helpers'
import { Material } from '../src/database/models/material.model'

const app = createApp()
useSeeders()

describe('Material API', () => {
    let adminToken: string
    let workerToken: string

    beforeEach(async () => {
        adminToken = await getAdminToken()
        workerToken = await getWorkerToken()
    })

    describe('GET /api/materials', () => {
        it('should return all seeded materials sorted by name', async () => {
            const res = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(4) // Hyaluronic Acid, Botox, Collagen Serum, Vitamin C Serum
            // First should be "Botox" (alphabetically sorted)
            expect(res.body[0].name).toBe('Botox')
        })
    })

    describe('POST /api/materials', () => {
        it('should create a new material with valid data', async () => {
            const materialData = {
                name: 'Hyaluronic Acid',
                unit: 'ml',
                stockOnHand: 100
            }

            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(materialData)

            expect(res.status).toBe(201)
            expect(res.body.name).toBe(materialData.name)
            expect(res.body.unit).toBe(materialData.unit)
            expect(res.body.stockOnHand).toBe(materialData.stockOnHand)
            expect(res.body._id).toBeDefined()
        })

        it('should fail when name is missing', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ unit: 'kg', stockOnHand: 10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when unit is missing', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Material', stockOnHand: 10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when stockOnHand is negative', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', unit: 'g', stockOnHand: -5 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when stockOnHand is not a number', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', unit: 'g', stockOnHand: 'invalid' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should accept zero stock', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Zero Stock', unit: 'g', stockOnHand: 0 })

            expect(res.status).toBe(201)
            expect(res.body.stockOnHand).toBe(0)
        })

        it('should reject invalid unit value', async () => {
            const res = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', unit: 'L', stockOnHand: 10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })
    })

    describe('GET /api/materials/:id', () => {
        it('should return material by id', async () => {
            const seeded = getSeededData()
            const material = seeded.materials.hyaluronicAcid

            const res = await request(app)
                .get(`/api/materials/${material._id}`)
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Hyaluronic Acid')
        })

        it('should return 404 for non-existent material', async () => {
            const res = await request(app)
                .get('/api/materials/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${workerToken}`)
            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Material not found')
        })
    })

    describe('PUT /api/materials/:id', () => {
        it('should update material', async () => {
            const seeded = getSeededData()
            const material = seeded.materials.botox

            const res = await request(app)
                .put(`/api/materials/${material._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name', stockOnHand: 100 })

            expect(res.status).toBe(200)
            expect(res.body.name).toBe('New Name')
            expect(res.body.stockOnHand).toBe(100)
        })

        it('should return 404 for non-existent material', async () => {
            const res = await request(app)
                .put('/api/materials/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name' })
            
            expect(res.status).toBe(404)
        })

        it('should reject invalid unit on update', async () => {
            const seeded = getSeededData()
            const material = seeded.materials.collagen

            const res = await request(app)
                .put(`/api/materials/${material._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ unit: 'liters' })

            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /api/materials/:id', () => {
        it('should delete material', async () => {
            const seeded = getSeededData()
            const material = seeded.materials.vitaminC

            const res = await request(app)
                .delete(`/api/materials/${material._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const check = await Material.findById(material._id)
            expect(check).toBeNull()
        })

        it('should return 404 for non-existent material', async () => {
            const res = await request(app)
                .delete('/api/materials/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(404)
        })
    })
})
