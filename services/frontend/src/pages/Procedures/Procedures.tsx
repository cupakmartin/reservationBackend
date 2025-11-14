// src/pages/Procedures/Procedures.tsx
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'

interface Procedure {
  _id: string
  name: string
  description: string
  price: number
  duration: number
}

export default function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
  })

  const fetchProcedures = async () => {
    try {
      const { data } = await api.get('/procedures')
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
  }, [])

  const handleOpenModal = (procedure?: Procedure) => {
    if (procedure) {
      setEditingProcedure(procedure)
      setFormData({
        name: procedure.name,
        description: procedure.description,
        price: procedure.price.toString(),
        duration: procedure.duration.toString(),
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
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
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
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Procedure
        </Button>
      </div>

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
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(procedure._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {procedure.description && (
                    <p className="text-sm text-gray-600 mb-3">{procedure.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {procedure.price}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {procedure.duration} min
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the procedure"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
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
