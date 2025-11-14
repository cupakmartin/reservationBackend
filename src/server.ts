// src/server.ts
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import { createApp } from './app'
import { createServer } from 'http'
import { initializeWebSocket } from './websocket'

const PORT = Number(process.env.PORT || 4000)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon'

async function main() {
  console.log('[api] booting…')
  console.log('[api] NODE_ENV =', process.env.NODE_ENV || 'development')
  console.log('[api] PORT     =', PORT)
  console.log('[api] MONGO_URI=', MONGO_URI)

  // Helpful mongoose logs
  mongoose.set('debug', false)
  mongoose.connection.on('error', err => console.error('[mongo] error:', err.message))
  mongoose.connection.on('disconnected', () => console.error('[mongo] disconnected'))

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000
  } as any)
  console.log('[api] Mongo connected')

  const app = createApp()
  const httpServer = createServer(app)
  
  // Initialize WebSocket server
  initializeWebSocket(httpServer)
  
  httpServer.listen(PORT, () => console.log(`[api] listening on :${PORT}`))
}

main().catch(err => {
  console.error('[api] startup error:', err)
  process.exit(1)
})
