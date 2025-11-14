import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '../setup'
import Clients from '../../pages/Clients/Clients'

describe('Clients Component - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays clients list', async () => {
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('opens create modal when Add Client button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add client/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Create Client')).toBeInTheDocument()
    })
  })

  it('successfully creates a new client', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    server.use(
      http.post('http://localhost:4000/api/auth/register', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          user: {
            _id: 'new-client-id',
            ...capturedRequest,
          },
          accessToken: 'token',
          refreshToken: 'refresh',
        }, { status: 201 })
      })
    )

    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add client/i })
    await user.click(addButton)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(nameInput, 'Jane Smith')
    await user.type(emailInput, 'jane@example.com')
    await user.type(passwordInput, 'password123')

    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.name).toBe('Jane Smith')
      expect(capturedRequest.email).toBe('jane@example.com')
      expect(capturedRequest.password).toBe('password123')
    })
  })

  it('validates required fields when creating client', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add client/i })
    await user.click(addButton)

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText('Create Client')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    // Modal should still be open (validation failed)
    await waitFor(() => {
      expect(screen.getByText('Create Client')).toBeInTheDocument()
    })
  })

  it('successfully updates an existing client', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    server.use(
      http.patch('http://localhost:4000/api/clients/:id', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          _id: '1',
          ...capturedRequest,
        })
      })
    )

    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and click edit button using aria-label
    const editButton = screen.getByLabelText('Edit John Doe')
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Client')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'John Updated')

    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.name).toBe('John Updated')
    })
  })

  it('successfully deletes a client', async () => {
    const user = userEvent.setup()
    let deleteWasCalled = false

    server.use(
      http.delete('http://localhost:4000/api/clients/:id', () => {
        deleteWasCalled = true
        return HttpResponse.json({ ok: true, message: 'Client deleted' })
      })
    )

    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and click delete button using aria-label
    const deleteButton = screen.getByLabelText('Delete John Doe')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(deleteWasCalled).toBe(true)
    })
  })

  it('filters clients by name', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('http://localhost:4000/api/clients', ({ request }) => {
        const url = new URL(request.url)
        const name = url.searchParams.get('name')
        
        if (name === 'Jane') {
          return HttpResponse.json([
            {
              _id: '2',
              name: 'Jane Doe',
              email: 'jane@example.com',
              phone: '+9876543210',
              role: 'client',
              loyaltyPoints: 150,
            },
          ])
        }
        
        return HttpResponse.json([
          {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            role: 'client',
            loyaltyPoints: 100,
          },
        ])
      })
    )

    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Open filters
    const filterButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filterButton)

    // Enter filter value
    const nameFilter = screen.getByLabelText(/name/i)
    await user.type(nameFilter, 'Jane')

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })
})
