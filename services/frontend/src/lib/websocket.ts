// src/lib/websocket.ts
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const WS_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

interface BookingEvent {
  event: 'created' | 'updated' | 'deleted' | 'status_changed'
  timestamp: string
  data: any
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<BookingEvent | null>(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    socketRef.current = io(WS_URL, {
      auth: {
        token: accessToken,
      },
    })

    socketRef.current.on('connect', () => {
      console.log('[WebSocket] Connected')
      setIsConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('[WebSocket] Disconnected')
      setIsConnected(false)
    })

    socketRef.current.on('bookings:updated', (data: BookingEvent) => {
      console.log('[WebSocket] Booking updated:', data)
      setLastEvent(data)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [accessToken])

  return { isConnected, lastEvent }
}
