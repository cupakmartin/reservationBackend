import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { setupTestHooks } from './helpers'
import { Procedure } from '../src/database/models/procedure.model'
import { Material } from '../src/database/models/material.model'

const app = createApp()
setupTestHooks()

describe('Procedure API', () => {
    describe('GET /api/procedures', () => {
        it('should return empty array when no procedures', async () => {
            const res = await request(app).get('/api/procedures')
            expect(res.status).toBe(200)
            expect(res.body).toEqual([])
        })

        it('should return all procedures sorted by name', async () => {
            await Procedure.create([
                { name: 'Massage', durationMin: 60, price: 50 },
                { name: 'Facial', durationMin: 45, price: 40 }
            ])

            const res = await request(app).get('/api/procedures')
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(2)
            expect(res.body[0].name).toBe('Facial')
            expect(res.body[1].name).toBe('Massage')
        })
    })

    describe('POST /api/procedures', () => {
        it('should create a new procedure with valid data', async () => {
            const procedureData = {
                name: 'Deep Tissue Massage',
                durationMin: 90,
                price: 75
            }

            const res = await request(app)
                .post('/api/procedures')
                .send(procedureData)

            expect(res.status).toBe(201)
            expect(res.body.name).toBe(procedureData.name)
            expect(res.body.durationMin).toBe(procedureData.durationMin)
            expect(res.body.price).toBe(procedureData.price)
            expect(res.body._id).toBeDefined()
        })

        it('should fail when name is missing', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .send({ durationMin: 60, price: 50 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when durationMin is not positive', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .send({ name: 'Test', durationMin: 0, price: 50 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when price is negative', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .send({ name: 'Test', durationMin: 30, price: -10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when price is not a number', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .send({ name: 'Test', durationMin: 30, price: 'free' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })
    })

    describe('POST /api/procedures/:id/bom', () => {
        it('should update procedure BOM with valid data', async () => {
            const procedure = await Procedure.create({
                name: 'Test Procedure',
                durationMin: 30,
                price: 25
            })

            const material = await Material.create({
                name: 'Test Material',
                unit: 'ml',
                stockOnHand: 100
            })

            const bom = [
                { materialId: material._id.toString(), qtyPerProcedure: 5 }
            ]

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .send(bom)

            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const updated = await Procedure.findById(procedure._id)
            expect(updated?.bom).toHaveLength(1)
            expect(updated?.bom[0].qtyPerProcedure).toBe(5)
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app)
                .post('/api/procedures/507f1f77bcf86cd799439011/bom')
                .send([])

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Procedure not found')
        })

        it('should fail when BOM item missing materialId', async () => {
            const procedure = await Procedure.create({
                name: 'Test',
                durationMin: 30,
                price: 25
            })

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .send([{ qtyPerProcedure: 5 }])

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when quantity is not positive', async () => {
            const procedure = await Procedure.create({
                name: 'Test',
                durationMin: 30,
                price: 25
            })

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .send([{ materialId: '507f1f77bcf86cd799439011', qtyPerProcedure: 0 }])

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should accept empty BOM', async () => {
            const procedure = await Procedure.create({
                name: 'Test',
                durationMin: 30,
                price: 25
            })

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .send([])

            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)
        })
    })

    describe('GET /api/procedures/:id', () => {
        it('should return procedure by id', async () => {
            const procedure = await Procedure.create({
                name: 'Test Procedure',
                durationMin: 60,
                price: 100
            })

            const res = await request(app).get(`/api/procedures/${procedure._id}`)
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Test Procedure')
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app).get('/api/procedures/507f1f77bcf86cd799439011')
            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Procedure not found')
        })
    })

    describe('PUT /api/procedures/:id', () => {
        it('should update procedure', async () => {
            const procedure = await Procedure.create({
                name: 'Old Name',
                durationMin: 60,
                price: 100
            })

            const res = await request(app)
                .put(`/api/procedures/${procedure._id}`)
                .send({ name: 'New Name', price: 150 })

            expect(res.status).toBe(200)
            expect(res.body.name).toBe('New Name')
            expect(res.body.price).toBe(150)
            expect(res.body.durationMin).toBe(60)
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app)
                .put('/api/procedures/507f1f77bcf86cd799439011')
                .send({ name: 'New Name' })
            
            expect(res.status).toBe(404)
        })
    })

    describe('DELETE /api/procedures/:id', () => {
        it('should delete procedure', async () => {
            const procedure = await Procedure.create({
                name: 'To Delete',
                durationMin: 30,
                price: 50
            })

            const res = await request(app).delete(`/api/procedures/${procedure._id}`)
            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const check = await Procedure.findById(procedure._id)
            expect(check).toBeNull()
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app).delete('/api/procedures/507f1f77bcf86cd799439011')
            expect(res.status).toBe(404)
        })
    })
})
