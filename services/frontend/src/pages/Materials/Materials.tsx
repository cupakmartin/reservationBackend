// src/pages/Materials/Materials.tsx
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Package, Filter, X } from 'lucide-react'

interface Material {
  _id: string
  name: string
  stockOnHand: number
  unit: string
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [filters, setFilters] = useState({
    name: '',
    unit: '',
    stockOnHand: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'name',
    order: 'asc',
  })

  const [formData, setFormData] = useState({
    name: '',
    stockOnHand: '',
    unit: '',
  })

  const fetchMaterials = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.name) params.append('name', filters.name)
      if (filters.unit) params.append('unit', filters.unit)
      if (filters.stockOnHand) params.append('stockOnHand', filters.stockOnHand)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.order) params.append('order', filters.order)
      
      const queryString = params.toString()
      const { data } = await api.get(`/materials${queryString ? `?${queryString}` : ''}`)
      setMaterials(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [filters])

  const handleOpenModal = (material?: Material) => {
    if (material) {
      setEditingMaterial(material)
      setFormData({
        name: material.name,
        stockOnHand: material.stockOnHand.toString(),
        unit: material.unit,
      })
    } else {
      setEditingMaterial(null)
      setFormData({ name: '', stockOnHand: '', unit: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMaterial(null)
    setFormData({ name: '', stockOnHand: '', unit: '' })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.stockOnHand || !formData.unit) {
      toast('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const data = {
        name: formData.name,
        stockOnHand: parseFloat(formData.stockOnHand),
        unit: formData.unit,
      }

      if (editingMaterial) {
        await api.patch(`/materials/${editingMaterial._id}`, data)
        toast('success', 'Material updated successfully!')
      } else {
        await api.post('/materials', data)
        toast('success', 'Material created successfully!')
      }

      fetchMaterials()
      handleCloseModal()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to save material')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      await api.delete(`/materials/${id}`)
      toast('success', 'Material deleted successfully!')
      fetchMaterials()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to delete material')
    }
  }

  const clearFilters = () => {
    setFilters({
      name: '',
      unit: '',
      stockOnHand: '',
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
        <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
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
            Add Material
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
              <Select
                label="Unit"
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                options={[
                  { value: '', label: 'All Units' },
                  { value: 'ml', label: 'ml' },
                  { value: 'g', label: 'g' },
                  { value: 'pcs', label: 'pcs' },
                ]}
              />
              <Input
                label="Min Stock"
                type="number"
                placeholder="Min stock"
                value={filters.stockOnHand}
                onChange={(e) => setFilters({ ...filters, stockOnHand: e.target.value })}
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
          <CardTitle>Inventory ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No materials found. Create your first one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(material => (
                <div 
                  key={material._id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      <h3 className="font-bold text-lg text-gray-900">{material.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(material)}
                        className="text-blue-600 hover:text-blue-700"
                        aria-label={`Edit ${material.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Delete ${material.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock on Hand:</span>
                      <span className="font-semibold text-lg">
                        {material.stockOnHand} {material.unit}
                      </span>
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
          title={editingMaterial ? 'Edit Material' : 'Create Material'}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Shampoo, Nail Polish, etc."
              required
            />

            <Input
              label="Stock on Hand"
              type="number"
              step="0.01"
              value={formData.stockOnHand}
              onChange={(e) => setFormData({ ...formData, stockOnHand: e.target.value })}
              placeholder="100"
              required
            />

            <Input
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="ml, g, pcs"
              required
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingMaterial ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
