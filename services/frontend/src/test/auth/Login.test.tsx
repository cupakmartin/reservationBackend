import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '../setup'
import Login from '../../pages/Auth/Login'
import { useAuthStore } from '../../store/authStore'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    // Clear the mock functions from authStore
    const store = useAuthStore.getState()
    vi.mocked(store.setTokens).mockClear()
    vi.mocked(store.setUser).mockClear()
  })

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText('GlowFlow Salon')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('successfully logs in user with valid credentials', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, '123456')
    await user.click(submitButton)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.setTokens).toHaveBeenCalledWith('mock-access-token', 'mock-refresh-token')
      expect(store.setUser).toHaveBeenCalledWith({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('displays error message on failed login', async () => {
    const user = userEvent.setup()
    
    // Override the default handler to return an error
    server.use(
      http.post('http://localhost:4000/api/auth/login', () => {
        return HttpResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      })
    )

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'wrong@test.com')
    await user.type(passwordInput, 'wrongpass')
    await user.click(submitButton)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.setTokens).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    
    // Add delay to login response to see loading state
    server.use(
      http.post('http://localhost:4000/api/auth/login', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
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
      })
    )
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, '123456')
    
    expect(submitButton).not.toBeDisabled()
    
    await user.click(submitButton)
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  it('has link to registration page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const registerLink = screen.getByText(/sign up/i)
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })
})
