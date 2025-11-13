import { beforeAll } from 'vitest'
import mongoose from 'mongoose'
import { setupTestHooks } from './helpers'

process.env.NODE_ENV = 'test'

beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/salon-test'
    await mongoose.connect(mongoUri)
})

setupTestHooks()
