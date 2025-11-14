// src/pages/Calendar/BookingModal.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, User, Briefcase, DollarSign } from 'lucide-react'

interface Booking {
  _id: string
  client: { _id: string; name: string; email: string }
  procedure: { _id: string; name: string; price: number; duration: number }
  date: string
  time: string
  status: string
  loyaltyPointsEarned?: number
}

interface Procedure {
  _id: string
  name: string
  price: number
  duration: number
}

interface Client {
  _id: string
  name: string
  email: string
}

interface BookingModalProps {
  date: Date
  onClose: () => void
  onSuccess: () => void
}

export default function BookingModal({ date, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    clientId: user?.role === 'client' ? user.id : '',
    procedureId: '',
    providerName: '',
    time: '',
    status: 'held',
    paymentType: 'cash',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dateStr = format(date, 'yyyy-MM-dd')
        const [bookingsRes, proceduresRes, clientsRes] = await Promise.all([
          api.get(`/bookings?date=${dateStr}`),
          api.get('/procedures'),
          user?.role !== 'client' ? api.get('/clients') : Promise.resolve({ data: [] }),
        ])

        setBookings(bookingsRes.data)
        setProcedures(proceduresRes.data)
        setClients(clientsRes.data)
      } catch (error) {
        toast('error', 'Failed to load booking data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [date, user?.role])

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.procedureId || !formData.time || !formData.providerName) {
      toast('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      // Find the selected procedure to get its duration
      const selectedProcedure = procedures.find(p => p._id === formData.procedureId)
      
      if (!selectedProcedure) {
        toast('error', 'Selected procedure not found')
        setSubmitting(false)
        return
      }

      // Create startsAt datetime
      const dateStr = format(date, 'yyyy-MM-dd')
      const startsAt = new Date(`${dateStr}T${formData.time}:00`)
      
      // Calculate endsAt based on procedure duration
      const endsAt = new Date(startsAt.getTime() + selectedProcedure.duration * 60000)

      await api.post('/bookings', {
        clientId: formData.clientId,
        procedureId: formData.procedureId,
        providerName: formData.providerName,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: formData.status,
        paymentType: formData.paymentType,
      })

      toast('success', 'Booking created successfully!')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}`, { status: newStatus })
      toast('success', 'Booking status updated!')
      const { data } = await api.get(`/bookings?date=${format(date, 'yyyy-MM-dd')}`)
      setBookings(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to update booking')
    }
  }

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      await api.delete(`/bookings/${bookingId}`)
      toast('success', 'Booking deleted successfully!')
      setBookings(bookings.filter(b => b._id !== bookingId))
      onSuccess()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to delete booking')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <Modal onClose={onClose} title={format(date, 'MMMM d, yyyy')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title={format(date, 'MMMM d, yyyy')}>
      <div className="space-y-6">
        {/* Existing Bookings */}
        {bookings.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Existing Bookings</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {bookings.map(booking => (
                <div key={booking._id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-semibold">{booking.time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{booking.client.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{booking.procedure.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>${booking.procedure.price}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  {(user?.role === 'worker' || user?.role === 'admin') && (
                    <div className="flex gap-2 pt-2 border-t">
                      {booking.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(booking._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(booking._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Booking */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Create New Booking
          </h3>

          {user?.role !== 'client' && (
            <Select
              label="Client"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              options={[
                { value: '', label: 'Select a client' },
                ...clients.map(c => ({ value: c._id, label: `${c.name} (${c.email})` })),
              ]}
              required
            />
          )}

          <Select
            label="Procedure"
            value={formData.procedureId}
            onChange={(e) => setFormData({ ...formData, procedureId: e.target.value })}
            options={[
              { value: '', label: 'Select a procedure' },
              ...procedures.map(p => ({ 
                value: p._id, 
                label: `${p.name} - $${p.price} (${p.duration} min)` 
              })),
            ]}
            required
          />

          <Input
            label="Provider Name"
            value={formData.providerName}
            onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
            placeholder="Name of the service provider"
            required
          />

          <Input
            label="Time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'held', label: 'Held' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'fulfilled', label: 'Fulfilled' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            required
          />

          <Select
            label="Payment Type"
            value={formData.paymentType}
            onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'deposit', label: 'Deposit' },
            ]}
            required
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
