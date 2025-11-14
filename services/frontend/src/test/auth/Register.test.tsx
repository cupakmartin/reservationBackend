import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '../setup'
import Register from '../../pages/Auth/Register'
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

describe('Register Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    // Clear the mock functions from authStore
    const store = useAuthStore.getState()
    vi.mocked(store.setTokens).mockClear()
    vi.mocked(store.setUser).mockClear()
  })

  it('renders registration form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    expect(screen.getByText('GlowFlow Salon')).toBeInTheDocument()
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('successfully registers a new user and auto-logs them in', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const phoneInput = screen.getByLabelText(/phone/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(phoneInput, '+1234567890')
    await user.click(submitButton)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.setTokens).toHaveBeenCalledWith('mock-access-token', 'mock-refresh-token')
      expect(store.setUser).toHaveBeenCalledWith({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('validates password length before submission', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, '123') // Too short
    await user.click(submitButton)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.setTokens).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('displays error when user already exists', async () => {
    const user = userEvent.setup()
    
    // Override the default handler to return a conflict error
    server.use(
      http.post('http://localhost:4000/api/auth/register', () => {
        return HttpResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        )
      })
    )
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(nameInput, 'Existing User')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.setTokens).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('allows selecting different roles', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const roleSelect = screen.getByLabelText(/role/i)
    
    // Should default to 'client'
    expect(roleSelect).toHaveValue('client')
    
    // Can change to 'worker'
    await user.selectOptions(roleSelect, 'worker')
    expect(roleSelect).toHaveValue('worker')
    
    // Can change to 'admin'
    await user.selectOptions(roleSelect, 'admin')
    expect(roleSelect).toHaveValue('admin')
  })

  it('disables submit button while registering', async () => {
    const user = userEvent.setup()
    
    // Add delay to register response to see loading state
    server.use(
      http.post('http://localhost:4000/api/auth/register', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
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
      })
    )
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(submitButton).not.toBeDisabled()
    
    await user.click(submitButton)
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })
  })

  it('has link to login page', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    const loginLink = screen.getByText(/sign in/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })
})
