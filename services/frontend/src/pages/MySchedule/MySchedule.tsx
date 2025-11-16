// src/pages/MySchedule/MySchedule.tsx
import { useEffect, useState } from 'react'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, User, Briefcase, DollarSign, CreditCard } from 'lucide-react'

interface Booking {
  _id: string
  clientId: {
    _id: string
    name: string
    email: string
  }
  procedureId: {
    _id: string
    name: string
    price: number
    durationMin: number
  }
  startsAt: string
  endsAt: string
  status: string
  paymentType: string
  finalPrice: number
}

export default function MySchedule() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { lastEvent } = useWebSocket()

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my-schedule')
      setBookings(data)
    } catch (error: any) {
      console.error('Failed to fetch schedule:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load your schedule'
      toast('error', errorMessage)
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
      await api.patch(`/bookings/${bookingId}/status/${newStatus}`)
      toast('success', 'Booking status updated successfully!')
      fetchBookings()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update booking status'
      toast('error', errorMessage)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'held':
        return 'confirmed'
      case 'confirmed':
        return 'fulfilled'
      default:
        return null
    }
  }

  const getNextStatusLabel = (currentStatus: string): string => {
    const next = getNextStatus(currentStatus)
    if (next === 'confirmed') return 'Confirm'
    if (next === 'fulfilled') return 'Complete'
    return ''
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
        <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-600">Total: {bookings.length} bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings assigned</h3>
            <p className="text-gray-600">You don't have any bookings assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <Card key={booking._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(new Date(booking.startsAt), 'd MMM yyyy')}
                  </CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-semibold">
                    {format(new Date(booking.startsAt), 'HH:mm')} - {format(new Date(booking.endsAt), 'HH:mm')}
                  </span>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-start text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.clientId.name}</p>
                      <p className="text-gray-600 text-xs">{booking.clientId.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">{booking.procedureId.name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-semibold text-green-600">${booking.finalPrice.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 ml-2">({booking.procedureId.durationMin} min)</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="capitalize">{booking.paymentType}</span>
                  </div>
                </div>

                <div className="border-t pt-3 flex gap-2">
                  {getNextStatus(booking.status) && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(booking._id, getNextStatus(booking.status)!)}
                      className="flex-1"
                    >
                      {getNextStatusLabel(booking.status)}
                    </Button>
                  )}
                  {booking.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusChange(booking._id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                  {booking.status === 'cancelled' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusChange(booking._id, 'held')}
                      className="flex-1"
                    >
                      Restore to Held
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
