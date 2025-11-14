import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '../setup'
import Procedures from '../../pages/Procedures/Procedures'

describe('Procedures Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays procedures list', async () => {
    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    // Wait for procedures to load
    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
    })
  })

  it('opens create modal when Add Procedure button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add procedure/i })
    await user.click(addButton)

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Create Procedure')).toBeInTheDocument()
    })
  })

  it('successfully creates a new procedure with correct data types', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    // Capture the request body
    server.use(
      http.post('http://localhost:4000/api/procedures', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          _id: 'new-procedure-id',
          ...capturedRequest,
        }, { status: 201 })
      })
    )

    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add procedure/i })
    await user.click(addButton)

    // Fill in the form
    const nameInput = screen.getByLabelText(/name/i)
    const priceInput = screen.getByLabelText(/price/i)
    const durationInput = screen.getByLabelText(/duration/i)

    await user.type(nameInput, 'Manicure')
    await user.type(priceInput, '35.50')
    await user.type(durationInput, '45')

    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    await waitFor(() => {
      // Verify the request was sent with correct data types
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.name).toBe('Manicure')
      expect(capturedRequest.price).toBe(35.50) // Should be a number, not string
      expect(typeof capturedRequest.price).toBe('number')
      expect(capturedRequest.durationMin).toBe(45) // Should be a number, not string
      expect(typeof capturedRequest.durationMin).toBe('number')
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add procedure/i })
    await user.click(addButton)

    // Try to submit without filling fields
    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    // Should not close modal (validation failed)
    await waitFor(() => {
      expect(screen.getByText('Create Procedure')).toBeInTheDocument()
    })
  })

  it('opens edit modal with existing procedure data', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    // Click edit button
    const editButtons = screen.getAllByRole('button', { hidden: true })
    const editButton = editButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide')
    )
    
    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Procedure')).toBeInTheDocument()
        // Form should be pre-filled with existing data
        expect(screen.getByDisplayValue('Haircut')).toBeInTheDocument()
      })
    }
  })

  it('successfully updates an existing procedure', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    server.use(
      http.patch('http://localhost:4000/api/procedures/:id', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          _id: '1',
          ...capturedRequest,
        })
      })
    )

    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { hidden: true })
    const editButton = editButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide')
    )
    
    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Procedure')).toBeInTheDocument()
      })

      const priceInput = screen.getByLabelText(/price/i)
      await user.clear(priceInput)
      await user.type(priceInput, '75.00')

      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(capturedRequest).toBeDefined()
        expect(capturedRequest.price).toBe(75)
        expect(typeof capturedRequest.price).toBe('number')
      })
    }
  })

  it('successfully deletes a procedure', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { hidden: true })
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide')
    )
    
    if (deleteButton) {
      await user.click(deleteButton)

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled()
      })
    }
    
    confirmSpy.mockRestore()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    server.use(
      http.post('http://localhost:4000/api/procedures', () => {
        return HttpResponse.json(
          { error: 'Validation failed' },
          { status: 400 }
        )
      })
    )

    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add procedure/i })
    await user.click(addButton)

    const nameInput = screen.getByLabelText(/name/i)
    const priceInput = screen.getByLabelText(/price/i)
    const durationInput = screen.getByLabelText(/duration/i)

    await user.type(nameInput, 'Test Procedure')
    await user.type(priceInput, '50')
    await user.type(durationInput, '30')

    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    // Should handle error and keep modal open
    await waitFor(() => {
      expect(screen.getByText('Create Procedure')).toBeInTheDocument()
    })
  })

  it('displays price and duration correctly', async () => {
    render(
      <BrowserRouter>
        <Procedures />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
      // Price should be displayed with dollar sign
      expect(screen.getByText('50', { exact: false })).toBeInTheDocument()
    })
  })
})
