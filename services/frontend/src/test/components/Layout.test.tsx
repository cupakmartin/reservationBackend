import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../../components/Layout'

// Mock useNavigate and useLocation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock auth store with default values that can be overridden
let mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' }
const mockLogout = vi.fn()

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    logout: mockLogout,
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setUser: vi.fn(),
    setTokens: vi.fn(),
  }),
}))

describe('Role-Based UI Rendering', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLogout.mockClear()
  })

  describe('Admin Role', () => {
    beforeEach(() => {
      mockUser = { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'admin' }
    })

    it('shows all navigation items for admin users', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      )

      // Admin should see all menu items except worker-specific ones
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Bookings')).toBeInTheDocument()
      expect(screen.getByText('Procedures')).toBeInTheDocument()
      expect(screen.getByText('Clients')).toBeInTheDocument()
      expect(screen.getByText('Materials')).toBeInTheDocument()
      
      // Admin should NOT see worker-only items
      expect(screen.queryByText('My Schedule')).not.toBeInTheDocument()
      expect(screen.queryByText('Completed Bookings')).not.toBeInTheDocument()
    })
  })

  describe('Worker Role', () => {
    beforeEach(() => {
      mockUser = { id: '2', name: 'Worker User', email: 'worker@test.com', role: 'worker' }
    })

    it('shows appropriate navigation items for worker users', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      )

      // Worker should see these items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Bookings')).toBeInTheDocument()
      expect(screen.getByText('My Schedule')).toBeInTheDocument()
      expect(screen.getByText('Completed Bookings')).toBeInTheDocument()
      expect(screen.getByText('Procedures')).toBeInTheDocument()
      expect(screen.getByText('Materials')).toBeInTheDocument()
      
      // Worker should NOT see Clients (admin-only)
      expect(screen.queryByText('Clients')).not.toBeInTheDocument()
    })
  })

  describe('Client Role', () => {
    beforeEach(() => {
      mockUser = { id: '3', name: 'Client User', email: 'client@test.com', role: 'client' }
    })

    it('shows only basic navigation items for client users', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      )

      // Client should see basic items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Bookings')).toBeInTheDocument()
      
      // Client should NOT see these admin/worker items
      expect(screen.queryByText('My Schedule')).not.toBeInTheDocument()
      expect(screen.queryByText('Completed Bookings')).not.toBeInTheDocument()
      expect(screen.queryByText('Procedures')).not.toBeInTheDocument()
      expect(screen.queryByText('Clients')).not.toBeInTheDocument()
      expect(screen.queryByText('Materials')).not.toBeInTheDocument()
    })
  })

  describe('User Info Display', () => {
    beforeEach(() => {
      mockUser = { id: '1', name: 'John Doe', email: 'john@test.com', role: 'admin' }
    })

    it('displays user name and role in header', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })
})
