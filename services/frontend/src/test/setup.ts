import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'

// Mock Zustand store globally before any imports
vi.mock('../store/authStore', () => {
  const mockState = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' as const },
    setTokens: vi.fn(),
    setUser: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: () => true,
  }
  
  return {
    useAuthStore: Object.assign(
      () => mockState,
      {
        getState: () => mockState,
        setState: vi.fn(),
        subscribe: vi.fn(),
        destroy: vi.fn(),
      }
    ),
  }
})

// Mock window.matchMedia (check if window exists first)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock window.confirm and window.alert
  Object.defineProperty(window, 'confirm', {
    writable: true,
    value: vi.fn(() => true),
  })

  Object.defineProperty(window, 'alert', {
    writable: true,
    value: vi.fn(),
  })
}

// Mock handlers for API calls
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:4000/api/auth/register', () => {
    return HttpResponse.json({
      user: {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }, { status: 201 })
  }),

  http.post('http://localhost:4000/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    })
  }),

  // Materials endpoints
  http.get('http://localhost:4000/api/materials', () => {
    return HttpResponse.json([
      {
        _id: '1',
        name: 'Shampoo',
        stockOnHand: 100,
        unit: 'ml',
      },
    ])
  }),

  http.post('http://localhost:4000/api/materials', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      _id: 'new-material-id',
      ...body,
    }, { status: 201 })
  }),

  http.patch('http://localhost:4000/api/materials/:id', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      _id: 'material-id',
      ...body,
    })
  }),

  http.delete('http://localhost:4000/api/materials/:id', () => {
    return HttpResponse.json({ ok: true, message: 'Material deleted' })
  }),

  // Procedures endpoints
  http.get('http://localhost:4000/api/procedures', () => {
    return HttpResponse.json([
      {
        _id: '1',
        name: 'Haircut',
        durationMin: 60,
        price: 50,
      },
    ])
  }),

  http.post('http://localhost:4000/api/procedures', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      _id: 'new-procedure-id',
      ...body,
    }, { status: 201 })
  }),

  http.patch('http://localhost:4000/api/procedures/:id', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      _id: 'procedure-id',
      ...body,
    })
  }),

  http.delete('http://localhost:4000/api/procedures/:id', () => {
    return HttpResponse.json({ ok: true, message: 'Procedure deleted' })
  }),

  // Clients endpoints
  http.get('http://localhost:4000/api/clients', () => {
    return HttpResponse.json([
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
    ])
  }),

  // Bookings endpoints
  http.get('http://localhost:4000/api/bookings', () => {
    return HttpResponse.json([
      {
        _id: '1',
        clientId: '1',
        procedureId: '1',
        status: 'confirmed',
        scheduledAt: new Date().toISOString(),
      },
      {
        _id: '2',
        clientId: '2',
        procedureId: '1',
        status: 'pending',
        scheduledAt: new Date().toISOString(),
      },
    ])
  }),
]

// Setup MSW server
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Close server after all tests
afterAll(() => server.close())
