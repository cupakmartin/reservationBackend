// src/pages/Clients/Clients.tsx
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Mail, Phone, Award } from 'lucide-react'

interface Client {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  loyaltyPoints: number
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client',
    password: '',
  })

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        role: client.role,
        password: '',
      })
    } else {
      setEditingClient(null)
      setFormData({ name: '', email: '', phone: '', role: 'client', password: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({ name: '', email: '', phone: '', role: 'client', password: '' })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast('error', 'Please fill in all required fields')
      return
    }

    if (!editingClient && !formData.password) {
      toast('error', 'Password is required for new clients')
      return
    }

    setSubmitting(true)

    try {
      const data: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      }

      if (formData.password) {
        data.password = formData.password
      }

      if (editingClient) {
        await api.patch(`/clients/${editingClient._id}`, data)
        toast('success', 'Client updated successfully!')
      } else {
        await api.post('/auth/register', data)
        toast('success', 'Client created successfully!')
      }

      fetchClients()
      handleCloseModal()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to save client')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      await api.delete(`/clients/${id}`)
      toast('success', 'Client deleted successfully!')
      fetchClients()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to delete client')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'worker': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
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
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No clients found. Create your first one!
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map(client => (
                <div key={client._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(client.role)}`}>
                          {client.role}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {client.phone}
                          </div>
                        )}
                        <div className="flex items-center text-green-600 font-semibold">
                          <Award className="h-4 w-4 mr-2" />
                          {client.loyaltyPoints} loyalty points
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
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
          title={editingClient ? 'Edit Client' : 'Create Client'}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'client', label: 'Client' },
                { value: 'worker', label: 'Worker' },
                { value: 'admin', label: 'Admin' },
              ]}
              required
            />

            <Input
              label={editingClient ? 'Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingClient}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingClient ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
