import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { useSeeders, getAdminToken, getSeededData } from './helpers'
import { Procedure } from '../src/database/models/procedure.model'
import { Material } from '../src/database/models/material.model'

const app = createApp()
useSeeders()

describe('Procedure API', () => {
    let adminToken: string

    beforeEach(async () => {
        adminToken = await getAdminToken()
    })

    describe('GET /api/procedures', () => {
        it('should return all seeded procedures sorted by name', async () => {
            const res = await request(app)
                .get('/api/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(4) // Hydrating Facial, Botox, Laser, Chemical Peel
            // First should be "Botox Injection" (alphabetically sorted)
            expect(res.body[0].name).toBe('Botox Injection')
            expect(res.body[1].name).toBe('Chemical Peel')
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
                .set('Authorization', `Bearer ${adminToken}`)
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
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ durationMin: 60, price: 50 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when durationMin is not positive', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', durationMin: 0, price: 50 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when price is negative', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', durationMin: 30, price: -10 })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when price is not a number', async () => {
            const res = await request(app)
                .post('/api/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', durationMin: 30, price: 'free' })

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })
    })

    describe('POST /api/procedures/:id/bom', () => {
        it('should update procedure BOM with valid data', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.laserTherapy // Has no BOM by default
            const material = seeded.materials.hyaluronicAcid

            const bom = [
                { materialId: material._id.toString(), qtyPerProcedure: 5 }
            ]

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .set('Authorization', `Bearer ${adminToken}`)
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
                .set('Authorization', `Bearer ${adminToken}`)
                .send([])

            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Procedure not found')
        })

        it('should fail when BOM item missing materialId', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.chemicalPeel

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send([{ qtyPerProcedure: 5 }])

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should fail when quantity is not positive', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.botoxInjection

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send([{ materialId: '507f1f77bcf86cd799439011', qtyPerProcedure: 0 }])

            expect(res.status).toBe(400)
            expect(res.body.error).toBe('Validation failed')
        })

        it('should accept empty BOM', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.facialTreatment

            const res = await request(app)
                .post(`/api/procedures/${procedure._id}/bom`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send([])

            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)
        })
    })

    describe('GET /api/procedures/:id', () => {
        it('should return procedure by id', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.facialTreatment

            const res = await request(app)
                .get(`/api/procedures/${procedure._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Hydrating Facial Treatment')
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app)
                .get('/api/procedures/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(404)
            expect(res.body.error).toBe('Procedure not found')
        })
    })

    describe('PUT /api/procedures/:id', () => {
        it('should update procedure', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.laserTherapy

            const res = await request(app)
                .put(`/api/procedures/${procedure._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name', price: 150 })

            expect(res.status).toBe(200)
            expect(res.body.name).toBe('New Name')
            expect(res.body.price).toBe(150)
            expect(res.body.durationMin).toBe(45)
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app)
                .put('/api/procedures/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name' })
            
            expect(res.status).toBe(404)
        })
    })

    describe('DELETE /api/procedures/:id', () => {
        it('should delete procedure', async () => {
            const seeded = getSeededData()
            const procedure = seeded.procedures.chemicalPeel

            const res = await request(app)
                .delete(`/api/procedures/${procedure._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)

            const check = await Procedure.findById(procedure._id)
            expect(check).toBeNull()
        })

        it('should return 404 for non-existent procedure', async () => {
            const res = await request(app)
                .delete('/api/procedures/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
            expect(res.status).toBe(404)
        })
    })
})
