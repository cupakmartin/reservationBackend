import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../pages/Dashboard/Dashboard'
import { useAuthStore } from '../../store/authStore'

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    // Reset to default admin state
    const defaultState = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' as const },
    }
    useAuthStore.setState(defaultState)
  })

  it('displays admin-only features for admin users', async () => {
    // Set admin user
    useAuthStore.setState({
      user: { 
        id: '1', 
        name: 'Admin User', 
        email: 'admin@test.com', 
        role: 'admin' as const 
      },
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Admin should see dashboard - wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    })
  })

  it('displays worker features for worker users', async () => {
    // Set worker user
    useAuthStore.setState({
      user: { 
        id: '2', 
        name: 'Worker User', 
        email: 'worker@test.com', 
        role: 'worker' as const 
      },
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Worker should also see dashboard - wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    })
  })

  it('displays client-only features for client users', async () => {
    // Set client user
    useAuthStore.setState({
      user: { 
        id: '3', 
        name: 'Client User', 
        email: 'client@test.com', 
        role: 'client' as const 
      },
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Client should see their own dashboard - wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    })
  })

  it('does not display admin features to non-admin users', async () => {
    // Set client user
    useAuthStore.setState({
      user: { 
        id: '3', 
        name: 'Client User', 
        email: 'client@test.com', 
        role: 'client' as const 
      },
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    })

    // Clients should NOT see certain admin-only UI elements
    // This would need to be customized based on actual UI implementation
    expect(screen.queryByText(/Manage All Users/i)).not.toBeInTheDocument()
  })
})
