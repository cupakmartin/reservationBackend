// src/pages/Materials/Materials.tsx
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Package, AlertCircle } from 'lucide-react'

interface Material {
  _id: string
  name: string
  quantity: number
  unit: string
  minimumStock: number
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    minimumStock: '',
  })

  const fetchMaterials = async () => {
    try {
      const { data } = await api.get('/materials')
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
  }, [])

  const handleOpenModal = (material?: Material) => {
    if (material) {
      setEditingMaterial(material)
      setFormData({
        name: material.name,
        quantity: material.quantity.toString(),
        unit: material.unit,
        minimumStock: material.minimumStock.toString(),
      })
    } else {
      setEditingMaterial(null)
      setFormData({ name: '', quantity: '', unit: '', minimumStock: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMaterial(null)
    setFormData({ name: '', quantity: '', unit: '', minimumStock: '' })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.quantity || !formData.unit || !formData.minimumStock) {
      toast('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const data = {
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        minimumStock: parseFloat(formData.minimumStock),
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

  const isLowStock = (material: Material) => {
    return material.quantity <= material.minimumStock
  }

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
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

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
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    isLowStock(material) ? 'border-red-300 bg-red-50' : ''
                  }`}
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
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="font-semibold text-lg">
                        {material.quantity} {material.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Minimum Stock:</span>
                      <span className="text-sm font-medium">
                        {material.minimumStock} {material.unit}
                      </span>
                    </div>

                    {isLowStock(material) && (
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium pt-2 border-t border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        Low stock - Reorder soon!
                      </div>
                    )}
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
              label="Quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="100"
              required
            />

            <Input
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="ml, pieces, bottles, etc."
              required
            />

            <Input
              label="Minimum Stock"
              type="number"
              step="0.01"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
              placeholder="20"
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
