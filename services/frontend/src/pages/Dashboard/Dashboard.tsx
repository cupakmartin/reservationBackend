// src/pages/Dashboard/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Calendar, Users, Package, Briefcase, Clock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Stats {
  bookings: { total: number; pending: number; confirmed: number; completed: number }
  clients?: number
  procedures?: number
  materials?: number
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { isConnected } = useWebSocket()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, clientsRes, proceduresRes, materialsRes] = await Promise.allSettled([
          api.get('/bookings'),
          user?.role !== 'client' ? api.get('/clients') : Promise.resolve({ data: [] }),
          api.get('/procedures'),
          user?.role !== 'client' ? api.get('/materials') : Promise.resolve({ data: [] }),
        ])

        const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : []
        const clients = clientsRes.status === 'fulfilled' ? clientsRes.value.data : []
        const procedures = proceduresRes.status === 'fulfilled' ? proceduresRes.value.data : []
        const materials = materialsRes.status === 'fulfilled' ? materialsRes.value.data : []

        setStats({
          bookings: {
            total: bookings.length,
            pending: bookings.filter((b: any) => b.status === 'pending').length,
            confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
            completed: bookings.filter((b: any) => b.status === 'completed').length,
          },
          clients: clients.length,
          procedures: procedures.length,
          materials: materials.length,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.role])

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your salon today.</p>
        </div>
        {isConnected && (
          <div className="flex items-center text-green-600 text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
            Live updates active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.bookings.total || 0}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.bookings.pending || 0}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.bookings.confirmed || 0}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.bookings.completed || 0}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-purple-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {(user?.role === 'worker' || user?.role === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'admin' && (
            <Link to="/clients">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clients</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.clients || 0}</p>
                    </div>
                    <Users className="h-10 w-10 text-blue-500 opacity-75" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link to="/procedures">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Procedures</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.procedures || 0}</p>
                  </div>
                  <Briefcase className="h-10 w-10 text-green-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/materials">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Materials</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.materials || 0}</p>
                  </div>
                  <Package className="h-10 w-10 text-purple-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/calendar"
              className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">View Calendar</h3>
                  <p className="text-sm text-gray-600">Check available slots and book appointments</p>
                </div>
              </div>
            </Link>

            <Link
              to="/bookings"
              className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Bookings</h3>
                  <p className="text-sm text-gray-600">View and update booking details</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
