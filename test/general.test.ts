import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'

const app = createApp()

describe('General API', () => {
    describe('GET /', () => {
        it('should return API info', async () => {
            const res = await request(app).get('/')
            
            expect(res.status).toBe(200)
            expect(res.body.ok).toBe(true)
            expect(res.body.name).toBe('GlowFlow API')
            expect(res.body.version).toBe('0.1.0')
        })
    })

    describe('GET /docs', () => {
        it('should serve Swagger documentation', async () => {
            const res = await request(app).get('/docs/')
            
            expect(res.status).toBe(200)
            expect(res.text).toContain('swagger-ui')
        })
    })

    describe('404 handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const res = await request(app).get('/non-existent-route')
            
            expect(res.status).toBe(404)
            expect(res.body.error).toBeDefined()
        })
    })
})
