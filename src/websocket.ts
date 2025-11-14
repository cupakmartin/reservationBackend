// src/websocket.ts
import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { authService } from './services/auth.service'

let io: SocketIOServer | null = null

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            credentials: true
        }
    })

    // JWT Authentication middleware
    io.use((socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
            
            if (!token) {
                return next(new Error('Authentication required'))
            }

            const payload = authService.verifyAccessToken(token)
            socket.data.user = payload
            next()
        } catch (error) {
            next(new Error('Invalid or expired token'))
        }
    })

    io.on('connection', (socket: Socket) => {
        const user = socket.data.user
        console.log(`[websocket] Client connected: ${user?.email} (${user?.role})`)

        // Join a room based on user role for targeted broadcasts
        if (user?.role) {
            socket.join(`role:${user.role}`)
        }

        socket.on('disconnect', () => {
            console.log(`[websocket] Client disconnected: ${user?.email}`)
        })

        // Handle ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong')
        })
    })

    console.log('[websocket] WebSocket server initialized')
    return io
}

export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('WebSocket server not initialized')
    }
    return io
}

// Helper function to emit booking updates
export function emitBookingUpdate(event: 'created' | 'updated' | 'deleted' | 'status_changed', data: any) {
    if (io) {
        io.emit('bookings:updated', {
            event,
            timestamp: new Date().toISOString(),
            data
        })
        console.log(`[websocket] Emitted bookings:updated event: ${event}`)
    }
}
