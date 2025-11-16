// src/pages/Calendar/Calendar.tsx
import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import BookingModal from './BookingModal'
import { toast } from '../../components/ui/Toast'

interface BookedDate {
  date: string
  count: number
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([])
  const [fullyBookedDays, setFullyBookedDays] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { lastEvent } = useWebSocket()

  const fetchCalendarData = useCallback(async () => {
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const [calendarData, availabilityData] = await Promise.all([
        api.get(`/bookings/calendar?month=${month}&year=${year}`),
        api.get(`/bookings/availability/${year}/${month}`)
      ])
      // Ensure data is always an array
      setBookedDates(Array.isArray(calendarData.data) ? calendarData.data : [])
      const fullyBooked = Array.isArray(availabilityData.data) ? availabilityData.data : []
      console.log('[Calendar] Fully booked days received:', fullyBooked)
      setFullyBookedDays(fullyBooked)
    } catch (error: any) {
      console.error('[Calendar] Error fetching data:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load calendar data'
      toast('error', errorMessage)
      setBookedDates([]) // Set empty array on error
      setFullyBookedDays([])
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    if (lastEvent) {
      fetchCalendarData()
    }
  }, [lastEvent, fetchCalendarData])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adjust start day to Monday (1) instead of Sunday (0)
  const startDay = monthStart.getDay()
  const emptyCells = Array(startDay === 0 ? 6 : startDay - 1).fill(null)

  const isDateBooked = (date: Date) => {
    if (!Array.isArray(bookedDates)) return false
    return bookedDates.some(bd => isSameDay(new Date(bd.date), date))
  }

  const getBookingCount = (date: Date) => {
    if (!Array.isArray(bookedDates)) return 0
    const booked = bookedDates.find(bd => isSameDay(new Date(bd.date), date))
    return booked?.count || 0
  }

  const isFullyBooked = (date: Date) => {
    if (!Array.isArray(fullyBookedDays)) return false
    const dateStr = format(date, 'yyyy-MM-dd')
    const isBooked = fullyBookedDays.includes(dateStr)
    if (isBooked) {
      console.log('[Calendar] Date is fully booked:', dateStr)
    }
    return isBooked
  }

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentDate)) return
    // Prevent booking on past dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return
    
    // Prevent booking on weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast('error', 'Bookings are only allowed Monday-Friday')
      return
    }

    // Prevent booking on fully booked days
    if (isFullyBooked(date)) {
      toast('error', 'This day is fully booked')
      return
    }
    
    setSelectedDate(date)
    setShowBookingModal(true)
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isWeekend = (date: Date) => {
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
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
        <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl">{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex justify-center">
            <div className="grid grid-cols-7">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-1 text-xs w-12">
                {day}
              </div>
            ))}

            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="w-12 h-12" />
            ))}

            {days.map(day => {
              const isBooked = isDateBooked(day)
              const bookingCount = getBookingCount(day)
              const isToday = isSameDay(day, new Date())
              const isPast = isPastDate(day)
              const isWeekendDay = isWeekend(day)
              const isFullyBookedDay = isFullyBooked(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  disabled={isPast || isWeekendDay || isFullyBookedDay}
                  className={`
                    w-12 h-12 p-1 border transition-all text-xs
                    ${isToday ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'}
                    ${isFullyBookedDay
                      ? 'bg-blue-500 text-white cursor-not-allowed'
                      : isWeekendDay
                        ? 'bg-red-50 text-red-400 cursor-not-allowed'
                        : isPast 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : isBooked 
                            ? 'bg-blue-100 hover:bg-blue-200 hover:shadow-md' 
                            : 'hover:bg-blue-50 hover:shadow-md hover:border-blue-300'
                    }
                    ${!isPast && !isWeekendDay && !isFullyBookedDay && 'active:scale-95'}
                    relative flex items-center justify-center
                  `}
                >
                  <div className="font-medium">{format(day, 'd')}</div>
                  {isBooked && !isPast && !isFullyBookedDay && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(bookingCount, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-blue-600 rounded-full" />
                      ))}
                      {bookingCount > 3 && (
                        <span className="text-[8px] text-blue-600 font-semibold">+</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
              <span>Fully booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border-2 border-blue-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded"></div>
              <span>Past</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-300 rounded"></div>
              <span>Weekend (closed)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBookingModal && selectedDate && (
        <BookingModal
          date={selectedDate}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedDate(null)
          }}
          onSuccess={() => {
            fetchCalendarData()
          }}
        />
      )}
    </div>
  )
}
