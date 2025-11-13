import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { Client } from '../src/database/models/client.model'

const app = createApp()

beforeEach(async () => {
    await Client.deleteMany({})
})

describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new client', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '123456789'
                })
            
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('user')
            expect(res.body).toHaveProperty('accessToken')
            expect(res.body).toHaveProperty('refreshToken')
            expect(res.body.user.email).toBe('test@example.com')
            expect(res.body.user.role).toBe('client')
            expect(res.body.user.password).toBeUndefined()
        })

        it('should register an admin', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Admin User',
                    email: 'admin@example.com',
                    password: 'password123',
                    role: 'admin'
                })
            
            expect(res.status).toBe(201)
            expect(res.body.user.role).toBe('admin')
        })

        it('should fail if email already exists', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                })
            
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User 2',
                    email: 'test@example.com',
                    password: 'password456'
                })
            
            expect(res.status).toBe(409)
            expect(res.body.error).toBe('User already exists')
        })

        it('should fail with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'password123'
                })
            
            expect(res.status).toBe(400)
        })

        it('should fail with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '123'
                })
            
            expect(res.status).toBe(400)
        })
    })

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                })
        })

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
            
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('user')
            expect(res.body).toHaveProperty('accessToken')
            expect(res.body).toHaveProperty('refreshToken')
            expect(res.body.user.password).toBeUndefined()
        })

        it('should fail with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                })
            
            expect(res.status).toBe(401)
            expect(res.body.error).toBe('Invalid credentials')
        })

        it('should fail with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            
            expect(res.status).toBe(401)
            expect(res.body.error).toBe('Invalid credentials')
        })
    })

    describe('POST /api/auth/refresh', () => {
        let refreshToken: string

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                })
            refreshToken = res.body.refreshToken
        })

        it('should refresh tokens with valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
            
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('accessToken')
            expect(res.body).toHaveProperty('refreshToken')
        })

        it('should fail with invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
            
            expect(res.status).toBe(401)
        })

        it('should fail without refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({})
            
            expect(res.status).toBe(400)
        })
    })
})

describe('Protected Routes', () => {
    let clientToken: string
    let workerToken: string
    let adminToken: string
    let clientId: string

    beforeEach(async () => {
        await Client.deleteMany({})
        
        // Register client
        const clientRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Client User',
                email: 'client@example.com',
                password: 'password123'
            })
        clientToken = clientRes.body.accessToken
        clientId = clientRes.body.user._id

        // Register worker
        const workerRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Worker User',
                email: 'worker@example.com',
                password: 'password123',
                role: 'worker'
            })
        workerToken = workerRes.body.accessToken

        // Register admin
        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            })
        adminToken = adminRes.body.accessToken
    })

    describe('GET /api/clients', () => {
        it('should allow admin to view all clients', async () => {
            const res = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${adminToken}`)
            
            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
        })

        it('should allow worker to view all clients', async () => {
            const res = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${workerToken}`)
            
            expect(res.status).toBe(200)
        })

        it('should deny client from viewing all clients', async () => {
            const res = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${clientToken}`)
            
            expect(res.status).toBe(403)
        })

        it('should deny unauthenticated access', async () => {
            const res = await request(app).get('/api/clients')
            
            expect(res.status).toBe(401)
        })
    })

    describe('GET /api/clients/:id', () => {
        it('should allow client to view own profile', async () => {
            const res = await request(app)
                .get(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`)
            
            expect(res.status).toBe(200)
        })

        it('should deny client from viewing other profiles', async () => {
            const otherRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Other User',
                    email: 'other@example.com',
                    password: 'password123'
                })
            
            const res = await request(app)
                .get(`/api/clients/${otherRes.body.user._id}`)
                .set('Authorization', `Bearer ${clientToken}`)
            
            expect(res.status).toBe(403)
        })

        it('should allow admin to view any profile', async () => {
            const res = await request(app)
                .get(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`)
            
            expect(res.status).toBe(200)
        })
    })

    describe('PUT /api/clients/:id', () => {
        it('should allow client to update own profile', async () => {
            const res = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Updated Name' })
            
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Updated Name')
        })

        it('should deny client from changing their role', async () => {
            const res = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ role: 'admin' })
            
            expect(res.status).toBe(403)
        })

        it('should allow admin to update any profile', async () => {
            const res = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Admin Updated' })
            
            expect(res.status).toBe(200)
        })
    })

    describe('DELETE /api/clients/:id', () => {
        it('should deny client from deleting', async () => {
            const res = await request(app)
                .delete(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`)
            
            expect(res.status).toBe(403)
        })

        it('should deny worker from deleting', async () => {
            const res = await request(app)
                .delete(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${workerToken}`)
            
            expect(res.status).toBe(403)
        })

        it('should allow admin to delete', async () => {
            const res = await request(app)
                .delete(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`)
            
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/materials', () => {
        it('should allow worker to view materials', async () => {
            const res = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${workerToken}`)
            
            expect(res.status).toBe(200)
        })

        it('should allow admin to view materials', async () => {
            const res = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
            
            expect(res.status).toBe(200)
        })

        it('should deny client from viewing materials', async () => {
            const res = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${clientToken}`)
            
            expect(res.status).toBe(403)
        })
    })

    describe('GET /api/procedures', () => {
        it('should allow any authenticated user to view procedures', async () => {
            const clientRes = await request(app)
                .get('/api/procedures')
                .set('Authorization', `Bearer ${clientToken}`)
            
            const workerRes = await request(app)
                .get('/api/procedures')
                .set('Authorization', `Bearer ${workerToken}`)
            
            const adminRes = await request(app)
                .get('/api/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
            
            expect(clientRes.status).toBe(200)
            expect(workerRes.status).toBe(200)
            expect(adminRes.status).toBe(200)
        })

        it('should deny unauthenticated access', async () => {
            const res = await request(app).get('/api/procedures')
            
            expect(res.status).toBe(401)
        })
    })
})
