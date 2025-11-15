// src/pages/Bookings/Bookings.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, User, Briefcase, DollarSign, Trash2 } from 'lucide-react'

interface Booking {
  _id: string
  clientId: { _id: string; name: string; email: string }
  procedureId: { _id: string; name: string; price: number; durationMin: number }
  startsAt: string
  endsAt: string
  status: string
  loyaltyPointsEarned?: number
}

export default function Bookings() {
  const { user } = useAuthStore()
  const { lastEvent } = useWebSocket()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings')
      setBookings(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast('error', err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (lastEvent) {
      fetchBookings()
    }
  }, [lastEvent])

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}`, { status: newStatus })
      toast('success', 'Booking status updated!')
      fetchBookings()
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
      fetchBookings()
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

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

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
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
            <div className="flex gap-4 items-center">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bookings found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-semibold">
                            {booking.startsAt ? format(new Date(booking.startsAt), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-semibold">
                            {booking.startsAt ? format(new Date(booking.startsAt), 'HH:mm') : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-semibold">{booking.clientId?.name ?? 'N/A'}</div>
                          <div className="text-gray-500">{booking.clientId?.email ?? 'N/A'}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-semibold">{booking.procedureId?.name ?? 'N/A'}</div>
                          <div className="text-gray-500 flex items-center">
                            <DollarSign className="h-3 w-3" />
                            {booking.procedureId?.price ?? 0} • {booking.procedureId?.durationMin ?? 0} min
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>

                      {(user?.role === 'worker' || user?.role === 'admin') && (
                        <div className="flex gap-2">
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
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.loyaltyPointsEarned && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      🎉 Earned {booking.loyaltyPointsEarned} loyalty points!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
