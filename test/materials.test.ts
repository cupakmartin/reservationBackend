import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { setupTestHooks } from './helpers'
import { Material } from '../src/database/models/material.model'

const app = createApp()
setupTestHooks()

describe('Material API', () => {
    describe('GET /api/materials', () => {
        it('should return empty array when no materials', async () => {
            const res = await request(app).get('/api/materials')
            expect(res.status).toBe(200)
            expect(res.body).toEqual([])
        })

        it('should return all materials sorted by name', async () => {
            await Material.create([
                { name: 'Zinc Oxide', unit: 'g', stockOnHand: 10 },
                { name: 'Aloe Vera', unit: 'ml', stockOnHand: 5 }
            ])

            const res = await request(app).get('/api/materials')
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(2)
            expect(res.body[0].name).toBe('Aloe Vera')
            expect(res.body[1].name).toBe('Zinc Oxide')
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
                .send({ unit: 'kg', stockOnHand: 10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when unit is missing', async () => {
            const res = await request(app)
                .post('/api/materials')
                .send({ name: 'Test Material', stockOnHand: 10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when stockOnHand is negative', async () => {
            const res = await request(app)
                .post('/api/materials')
                .send({ name: 'Test', unit: 'g', stockOnHand: -5 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when stockOnHand is not a number', async () => {
            const res = await request(app)
                .post('/api/materials')
                .send({ name: 'Test', unit: 'g', stockOnHand: 'invalid' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should accept zero stock', async () => {
            const res = await request(app)
                .post('/api/materials')
                .send({ name: 'Zero Stock', unit: 'g', stockOnHand: 0 })

            expect(res.status).toBe(201)
            expect(res.body.stockOnHand).toBe(0)
        })
    })
})
