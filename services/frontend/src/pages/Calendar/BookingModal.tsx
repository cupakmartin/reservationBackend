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
import { Calendar, Clock } from 'lucide-react'

interface Procedure {
  _id: string
  name: string
  price: number
  durationMin: number
}

interface Client {
  _id: string
  name: string
  email: string
}

interface Worker {
  _id: string
  name: string
}

interface BookingModalProps {
  date: Date
  onClose: () => void
  onSuccess: () => void
}

export default function BookingModal({ date, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuthStore()
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerSchedule, setWorkerSchedule] = useState<{ startsAt: string; endsAt: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    clientId: user?.role === 'client' || user?.role === 'worker' ? user.id : '',
    procedureId: '',
    workerId: '',
    time: '',
    status: 'held',
    paymentType: 'cash',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proceduresRes, clientsRes, workersRes] = await Promise.all([
          api.get('/procedures'),
          user?.role === 'admin' ? api.get('/clients') : Promise.resolve({ data: [] }),
          api.get('/clients/workers'),
        ])

        setProcedures(proceduresRes.data)
        setClients(clientsRes.data)
        
        // Filter out current worker from workers list to prevent self-booking
        const allWorkers = workersRes.data
        const filteredWorkers = user?.role === 'worker' 
          ? allWorkers.filter((w: Worker) => w._id !== user.id)
          : allWorkers
        setWorkers(filteredWorkers)
      } catch (error: any) {
        console.error('Error fetching booking data:', error)
        const errorMessage = error.response?.data?.error || 'Failed to load booking data'
        toast('error', errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [date, user?.role, user?.id])

  // Fetch worker schedule when worker is selected
  useEffect(() => {
    const fetchWorkerSchedule = async () => {
      if (!formData.workerId) {
        setWorkerSchedule([])
        return
      }

      try {
        const dateStr = format(date, 'yyyy-MM-dd')
        const { data } = await api.get(`/bookings/schedule/${formData.workerId}?date=${dateStr}`)
        setWorkerSchedule(data)
      } catch (error: any) {
        console.error('Error fetching worker schedule:', error)
        toast('error', 'Failed to load worker schedule')
      }
    }

    fetchWorkerSchedule()
  }, [formData.workerId, date])

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.procedureId || !formData.time || !formData.workerId) {
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
      const endsAt = new Date(startsAt.getTime() + selectedProcedure.durationMin * 60000)

      // Validate that the booking doesn't end after 20:00
      const endHour = endsAt.getHours()
      const endMinutes = endsAt.getMinutes()
      if (endHour > 20 || (endHour === 20 && endMinutes > 0)) {
        toast('error', 'This booking would end after 20:00. Please choose an earlier time.')
        setSubmitting(false)
        return
      }

      await api.post('/bookings', {
        clientId: formData.clientId,
        procedureId: formData.procedureId,
        workerId: formData.workerId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: formData.status,
        paymentType: formData.paymentType,
      })

      toast('success', 'Booking created successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      let message = 'Failed to create booking.';
      if (error.response?.data?.details) {
        // Zod validation error
        message = error.response.data.details[0].message;
      } else if (error.response?.data?.error) {
        // Custom backend error
        message = error.response.data.error;
      }
      toast('error', message);
    } finally {
      setSubmitting(false)
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
        {/* Worker Schedule */}
        {formData.workerId && workerSchedule.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Worker is busy:</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {workerSchedule.map((slot, index) => (
                <div key={index} className="flex items-center text-sm bg-gray-50 rounded px-3 py-2">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {format(new Date(slot.startsAt), 'HH:mm')} - {format(new Date(slot.endsAt), 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Booking */}
        <div className={formData.workerId && workerSchedule.length > 0 ? 'border-t pt-6 space-y-4' : 'space-y-4'}>
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Create New Booking
          </h3>

          {user?.role === 'admin' && (
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
                label: `${p.name} - $${p.price} (${p.durationMin} min)` 
              })),
            ]}
            required
          />

          <Select
            label="Worker"
            value={formData.workerId}
            onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
            options={[
              { value: '', label: 'Select a worker' },
              ...workers.map(w => ({ value: w._id, label: w.name })),
            ]}
            required
          />

          <Input
            label="Time (08:00 - 20:00)"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            min="08:00"
            max="20:00"
            step="60"
            required
          />

          {user?.role === 'admin' && (
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
          )}

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
