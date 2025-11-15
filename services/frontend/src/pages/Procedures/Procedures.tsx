// src/pages/Procedures/Procedures.tsx
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Clock, DollarSign, Filter, X } from 'lucide-react'

interface Procedure {
  _id: string
  name: string
  description?: string
  durationMin: number
  price: number
}

export default function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [filters, setFilters] = useState({
    name: '',
    durationMin: '',
    price: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'name',
    order: 'asc',
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
  })

  const fetchProcedures = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.name) params.append('name', filters.name)
      if (filters.durationMin) params.append('durationMin', filters.durationMin)
      if (filters.price) params.append('price', filters.price)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.order) params.append('order', filters.order)
      
      const queryString = params.toString()
      const { data } = await api.get(`/procedures${queryString ? `?${queryString}` : ''}`)
      setProcedures(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to load procedures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProcedures()
  }, [filters])

  const handleOpenModal = (procedure?: Procedure) => {
    if (procedure) {
      setEditingProcedure(procedure)
      setFormData({
        name: procedure.name,
        description: procedure.description || '',
        price: procedure.price.toString(),
        duration: procedure.durationMin.toString(),
      })
    } else {
      setEditingProcedure(null)
      setFormData({ name: '', description: '', price: '', duration: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProcedure(null)
    setFormData({ name: '', description: '', price: '', duration: '' })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      toast('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        durationMin: parseInt(formData.duration),
        price: parseFloat(formData.price),
      }

      if (editingProcedure) {
        await api.patch(`/procedures/${editingProcedure._id}`, data)
        toast('success', 'Procedure updated successfully!')
      } else {
        await api.post('/procedures', data)
        toast('success', 'Procedure created successfully!')
      }

      fetchProcedures()
      handleCloseModal()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to save procedure')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this procedure?')) return

    try {
      await api.delete(`/procedures/${id}`)
      toast('success', 'Procedure deleted successfully!')
      fetchProcedures()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to delete procedure')
    }
  }

  const clearFilters = () => {
    setFilters({
      name: '',
      durationMin: '',
      price: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'name',
      order: 'asc',
    })
  }

  const hasActiveFilters = Object.values(filters).some(val => val !== '')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Procedures</h1>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v).length})`}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Procedure
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                label="Name"
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              <Input
                label="Min Duration (min)"
                type="number"
                placeholder="Min duration"
                value={filters.durationMin}
                onChange={(e) => setFilters({ ...filters, durationMin: e.target.value })}
              />
              <Input
                label="Min Price ($)"
                type="number"
                step="0.01"
                placeholder="Min price"
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: e.target.value })}
              />
              <Input
                label="Date From"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <Input
                label="Date To"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'createdAt', label: 'Date Created' },
                ]}
              />
              <Select
                label="Order"
                value={filters.order}
                onChange={(e) => setFilters({ ...filters, order: e.target.value })}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' },
                ]}
              />
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Procedures ({procedures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {procedures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No procedures found. Create your first one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {procedures.map(procedure => (
                <div key={procedure._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-900">{procedure.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(procedure)}
                        className="text-blue-600 hover:text-blue-700"
                        aria-label={`Edit ${procedure.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(procedure._id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Delete ${procedure.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {procedure.price}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {procedure.durationMin} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <Modal
          onClose={handleCloseModal}
          title={editingProcedure ? 'Edit Procedure' : 'Create Procedure'}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Haircut, Manicure, etc."
              required
            />

            <div>
              <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description-input"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the procedure"
              />
            </div>

            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="50.00"
              required
            />

            <Input
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="60"
              required
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingProcedure ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
