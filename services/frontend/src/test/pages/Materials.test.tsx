import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '../setup'
import Materials from '../../pages/Materials/Materials'

describe('Materials Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays materials list', async () => {
    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
      expect(screen.getByText('100 ml')).toBeInTheDocument()
    })
  })

  it('opens create modal when Add Material button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add material/i })
    await user.click(addButton)

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Create Material')).toBeInTheDocument()
    })
  })

  it('successfully creates a new material with correct data types', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    // Capture the request body
    server.use(
      http.post('http://localhost:4000/api/materials', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          _id: 'new-material-id',
          ...capturedRequest,
        }, { status: 201 })
      })
    )

    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add material/i })
    await user.click(addButton)

    // Fill in the form
    const nameInput = screen.getByLabelText(/name/i)
    const stockInput = screen.getByLabelText(/stock on hand/i)
    const unitInput = screen.getByLabelText(/unit/i)

    await user.type(nameInput, 'Hair Gel')
    await user.type(stockInput, '250')
    await user.type(unitInput, 'ml')

    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    await waitFor(() => {
      // Verify the request was sent with correct data types
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.name).toBe('Hair Gel')
      expect(capturedRequest.stockOnHand).toBe(250) // Should be a number, not string
      expect(typeof capturedRequest.stockOnHand).toBe('number')
      expect(capturedRequest.unit).toBe('ml')
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add material/i })
    await user.click(addButton)

    // Try to submit without filling fields
    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    // Should not close modal (validation failed)
    await waitFor(() => {
      expect(screen.getByText('Create Material')).toBeInTheDocument()
    })
  })

  it('opens edit modal with existing material data', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    // Click edit button (first one in the list)
    const editButtons = screen.getAllByRole('button', { hidden: true })
    const editButton = editButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide')
    )
    
    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Material')).toBeInTheDocument()
        // Form should be pre-filled with existing data
        expect(screen.getByDisplayValue('Shampoo')).toBeInTheDocument()
      })
    }
  })

  it('successfully updates an existing material', async () => {
    const user = userEvent.setup()
    let capturedRequest: any = null

    server.use(
      http.patch('http://localhost:4000/api/materials/:id', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          _id: '1',
          ...capturedRequest,
        })
      })
    )

    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { hidden: true })
    const editButton = editButtons.find(btn => 
      btn.querySelector('svg')?.classList.toString().includes('lucide')
    )
    
    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Material')).toBeInTheDocument()
      })

      const stockInput = screen.getByLabelText(/stock on hand/i)
      await user.clear(stockInput)
      await user.type(stockInput, '150')

      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(capturedRequest).toBeDefined()
        expect(capturedRequest.stockOnHand).toBe(150)
        expect(typeof capturedRequest.stockOnHand).toBe('number')
      })
    }
  })

  it('successfully deletes a material', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
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
      http.post('http://localhost:4000/api/materials', () => {
        return HttpResponse.json(
          { error: 'Validation failed' },
          { status: 400 }
        )
      })
    )

    render(
      <BrowserRouter>
        <Materials />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add material/i })
    await user.click(addButton)

    const nameInput = screen.getByLabelText(/name/i)
    const stockInput = screen.getByLabelText(/stock on hand/i)
    const unitInput = screen.getByLabelText(/unit/i)

    await user.type(nameInput, 'Test Material')
    await user.type(stockInput, '100')
    await user.type(unitInput, 'ml')

    const createButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(createButton)

    // Should handle error and keep modal open
    await waitFor(() => {
      expect(screen.getByText('Create Material')).toBeInTheDocument()
    })
  })
})
