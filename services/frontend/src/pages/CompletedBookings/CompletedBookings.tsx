// src/pages/CompletedBookings/CompletedBookings.tsx
import { useEffect, useState } from 'react'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Calendar, Clock, User, Briefcase, DollarSign, CreditCard, Filter } from 'lucide-react'

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

export default function CompletedBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { lastEvent } = useWebSocket()
  
  const [clientName, setClientName] = useState('')
  const [date, setDate] = useState('')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [priceSort, setPriceSort] = useState('')

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams()
      
      if (clientName) params.append('clientName', clientName)
      if (date) params.append('date', date)
      if (dateRangeStart) params.append('dateRangeStart', dateRangeStart)
      if (dateRangeEnd) params.append('dateRangeEnd', dateRangeEnd)
      if (priceSort) params.append('priceSort', priceSort)
      
      const queryString = params.toString()
      const url = `/bookings/completed-schedule${queryString ? `?${queryString}` : ''}`
      
      const { data } = await api.get(url)
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error)
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load completed bookings'
      toast('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (lastEvent) {
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent])

  const handleApplyFilters = () => {
    setLoading(true)
    fetchBookings()
  }

  const handleClearFilters = () => {
    setClientName('')
    setDate('')
    setDateRangeStart('')
    setDateRangeEnd('')
    setPriceSort('')
    setLoading(true)
    
    setTimeout(() => {
      fetchBookings()
    }, 0)
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
        <h1 className="text-3xl font-bold text-gray-900">Completed Bookings</h1>
        <p className="text-gray-600">Total: {bookings.length} bookings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Search by client name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Sort
              </label>
              <Select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                options={[
                  { value: '', label: 'No sorting' },
                  { value: 'asc', label: 'Price: Low to High' },
                  { value: 'desc', label: 'Price: High to Low' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range Start
              </label>
              <Input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range End
              </label>
              <Input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} variant="primary">
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="secondary">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed bookings</h3>
            <p className="text-gray-600">You don't have any completed bookings matching the filters.</p>
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
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-300">
                    Completed
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
