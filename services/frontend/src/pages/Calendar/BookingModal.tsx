// src/pages/Calendar/BookingModal.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import TimeInput from '../../components/ui/TimeInput'
import Avatar from '../../components/ui/Avatar'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'

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
  avatarUrl?: string
}

interface BookingStatus {
  date: string
  startsAt: string
  endsAt: string
  procedureName: string
  type: 'personal' | 'work'
}

interface BookingModalProps {
  date: Date
  bookingStatus: BookingStatus[]
  onClose: () => void
  onSuccess: () => void
}

export default function BookingModal({ date, bookingStatus, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuthStore()
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerRatings, setWorkerRatings] = useState<Record<string, number>>({})
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
        
        // Fetch ratings for all workers
        const ratings: Record<string, number> = {}
        await Promise.all(
          filteredWorkers.map(async (worker: Worker) => {
            try {
              const { data } = await api.get(`/reviews/worker/${worker._id}`)
              ratings[worker._id] = data.averageRating || 0
            } catch {
              ratings[worker._id] = 0
            }
          })
        )
        setWorkerRatings(ratings)
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

  const getPersonalConflicts = () => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookingStatus.filter(
      status => status.type === 'personal' && format(new Date(status.date), 'yyyy-MM-dd') === dateStr
    )
  }

  const getWorkConflicts = () => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookingStatus.filter(
      status => status.type === 'work' && format(new Date(status.date), 'yyyy-MM-dd') === dateStr
    )
  }

  const formatTime = (isoString: string) => {
    return format(new Date(isoString), 'HH:mm')
  }

  const getMinTime = () => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    // If selected date is today, set min time to current hour rounded up
    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours()
      const currentMinutes = now.getMinutes()
      
      // Round up to next hour if there are any minutes
      const minHour = currentMinutes > 0 ? currentHour + 1 : currentHour
      
      // Ensure it's at least 08:00
      const effectiveMinHour = Math.max(minHour, 8)
      
      return `${effectiveMinHour.toString().padStart(2, '0')}:00`
    }
    
    return '08:00'
  }

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
      const now = new Date()
      
      // Validate that booking is not in the past
      if (startsAt <= now) {
        toast('error', 'Cannot create bookings in the past. Please choose a future time.')
        setSubmitting(false)
        return
      }
      
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
      <Modal onClose={onClose} title={format(date, 'd MMMM yyyy')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title={format(date, 'd MMMM yyyy')}>
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

          {getPersonalConflicts().length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">Personal Booking Conflict</p>
                  {getPersonalConflicts().map((conflict, idx) => (
                    <p key={idx} className="text-yellow-700 text-sm mt-1">
                      You have a personal booking: {conflict.procedureName} at {formatTime(conflict.startsAt)} - {formatTime(conflict.endsAt)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(user?.role === 'worker' || user?.role === 'admin') && getWorkConflicts().length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">Work Schedule Conflict</p>
                  {getWorkConflicts().map((conflict, idx) => (
                    <p key={idx} className="text-blue-700 text-sm mt-1">
                      You are working: {conflict.procedureName} at {formatTime(conflict.startsAt)} - {formatTime(conflict.endsAt)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.workerId && workerSchedule.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Selected Worker is Busy</p>
                  <div className="text-red-700 text-sm mt-1">
                    {workerSchedule.map((slot, idx) => (
                      <span key={idx}>
                        {formatTime(slot.startsAt)} - {formatTime(slot.endsAt)}
                        {idx < workerSchedule.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.workerId}
              onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a worker</option>
              {workers.map(w => {
                const rating = workerRatings[w._id]
                const ratingText = rating > 0 ? ` ⭐ ${rating.toFixed(1)}` : ''
                return (
                  <option key={w._id} value={w._id}>
                    {w.name}{ratingText}
                  </option>
                )
              })}
            </select>
            {formData.workerId && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Avatar 
                  name={workers.find(w => w._id === formData.workerId)?.name || ''} 
                  avatarUrl={workers.find(w => w._id === formData.workerId)?.avatarUrl}
                  size="sm"
                />
                <span>
                  {workers.find(w => w._id === formData.workerId)?.name}
                  {workerRatings[formData.workerId] > 0 && (
                    <span className="ml-2">⭐ {workerRatings[formData.workerId].toFixed(1)}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          <TimeInput
            label="Time (08:00 - 20:00)"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            min={getMinTime()}
            max="20:00"
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
