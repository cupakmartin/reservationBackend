// src/pages/Bookings/Bookings.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, User, Briefcase, DollarSign, Trash2, Filter, X } from 'lucide-react'

interface Booking {
  _id: string
  clientId: { _id: string; name: string; email: string; loyaltyTier?: string | null }
  workerId?: { _id: string; name: string }
  procedureId: { _id: string; name: string; price: number; durationMin: number }
  startsAt: string
  endsAt: string
  status: string
  previousStatus?: string
  loyaltyPointsEarned?: number
  finalPrice: number
}

// Helper: Map backend status to display text
const getStatusDisplayText = (status: string): string => {
  const statusMap: Record<string, string> = {
    held: 'Pending',
    confirmed: 'Confirmed',
    fulfilled: 'Completed',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || status
}

// Helper: Get available status transitions based on current status
const getAvailableTransitions = (status: string): string[] => {
  if (status === 'held') return ['confirmed', 'cancelled']
  if (status === 'confirmed') return ['fulfilled', 'cancelled']
  if (status === 'fulfilled') return ['cancelled']
  if (status === 'cancelled') return ['held', 'confirmed']
  return []
}

export default function Bookings() {
  const { user } = useAuthStore()
  const { lastEvent } = useWebSocket()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    clientName: '',
    workerName: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'startsAt',
    order: 'desc',
  })

  const fetchBookings = async () => {
    try {
      // Admin fetches all bookings, clients and workers fetch their own
      const endpoint = user?.role === 'admin' ? '/bookings' : '/bookings/my-bookings'
      
      // Build query params for filtering and sorting
      const params = new URLSearchParams()
      if (filters.clientName) params.append('clientName', filters.clientName)
      if (filters.workerName) params.append('workerName', filters.workerName)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.order) params.append('order', filters.order)
      
      const queryString = params.toString()
      const { data } = await api.get(`${endpoint}${queryString ? `?${queryString}` : ''}`)
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
  }, [user?.role, filters])

  useEffect(() => {
    if (lastEvent) {
      fetchBookings()
    }
  }, [lastEvent])

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status/${newStatus}`)
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
      case 'held': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'fulfilled': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

  const clearFilters = () => {
    setFilters({
      clientName: '',
      workerName: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'startsAt',
      order: 'desc',
    })
  }

  const hasActiveFilters = filters.clientName || filters.workerName || filters.dateFrom || filters.dateTo || 
    filters.sortBy !== 'startsAt' || filters.order !== 'desc'

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
        <Button 
          variant="secondary" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
              Active
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters & Sorting</CardTitle>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Client Name"
                placeholder="Search by client name..."
                value={filters.clientName}
                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
              />
              
              <Input
                label="Worker Name"
                placeholder="Search by worker name..."
                value={filters.workerName}
                onChange={(e) => setFilters({ ...filters, workerName: e.target.value })}
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

              <Select
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                options={[
                  { value: 'startsAt', label: 'Booking Date' },
                  { value: 'createdAt', label: 'Date Created' },
                  { value: 'clientName', label: 'Client Name' },
                  { value: 'workerName', label: 'Worker Name' },
                  { value: 'price', label: 'Price' },
                  { value: 'duration', label: 'Duration' },
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
          </CardContent>
        </Card>
      )}

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
                  { value: 'held', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'fulfilled', label: 'Completed' },
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
                  <div className="flex items-center gap-6">
                    <div className={`flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 ${
                      user?.role === 'client' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
                    }`}>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">
                            {booking.startsAt ? format(new Date(booking.startsAt), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">
                            {booking.startsAt ? format(new Date(booking.startsAt), 'HH:mm') : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {user?.role === 'admin' && (
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">{booking.clientId?.name ?? 'N/A'}</div>
                            <div className="text-gray-500">{booking.clientId?.email ?? 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      {user?.role === 'worker' && (
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">Client</div>
                            <div className="text-gray-500">{booking.clientId?.name ?? 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      {user?.role !== 'client' && (
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-blue-600">Worker</div>
                            <div className="text-gray-500">{booking.workerId?.name ?? 'Not Assigned'}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{booking.procedureId?.name ?? 'N/A'}</div>
                          <div className="text-gray-500 flex items-center">
                            <DollarSign className="h-3 w-3" />
                            {booking.finalPrice ?? booking.procedureId?.price ?? 0}
                            {booking.finalPrice && booking.procedureId?.price && booking.finalPrice < booking.procedureId.price && (
                              <span className="ml-1 text-green-600 font-medium">
                                ({Math.round((1 - booking.finalPrice / booking.procedureId.price) * 100)}% off)
                              </span>
                            )}
                            {!booking.finalPrice && booking.procedureId?.price && (
                              <span className="ml-1 line-through text-gray-400">{booking.procedureId.price}</span>
                            )}
                             • {booking.procedureId?.durationMin ?? 0} min
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 flex-shrink-0 ${
                      user?.role === 'client' || user?.role === 'worker' ? 'flex-col w-40' : 'min-w-fit'
                    }`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap w-24 text-center ${getStatusColor(booking.status)}`}>
                        {getStatusDisplayText(booking.status)}
                      </span>

                      {user?.role === 'admin' ? (
                        // Admin view: show status dropdown and delete button
                        <>
                          {getAvailableTransitions(booking.status).length > 0 && (
                            <Select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleStatusChange(booking._id, e.target.value)
                                }
                              }}
                              options={[
                                { value: '', label: 'Change Status' },
                                ...getAvailableTransitions(booking.status).map(status => ({
                                  value: status,
                                  label: getStatusDisplayText(status)
                                }))
                              ]}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(booking._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        // Client/Worker view: only show cancel button for 'held' bookings
                        booking.status === 'held' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStatusChange(booking._id, 'cancelled')}
                          >
                            Cancel Booking
                          </Button>
                        )
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
