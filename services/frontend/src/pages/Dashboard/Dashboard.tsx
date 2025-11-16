// src/pages/Dashboard/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../lib/websocket'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Calendar, Users, Package, Briefcase, Clock, CheckCircle, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'

interface Stats {
  bookings: { total: number; pending: number; confirmed: number; completed: number }
  clients?: number
  procedures?: number
  materials?: number
}

interface WorkerStats {
  personalStats: Array<{ _id: string; count: number }>
  workStats: Array<{ _id: string; count: number }>
}

interface UserDetails {
  _id: string
  name: string
  email: string
  password: string
  phone?: string
  loyaltyTier: string | null
  visitsCount: number
  role: string
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { isConnected } = useWebSocket()
  const [stats, setStats] = useState<Stats | null>(null)
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'worker') {
          const [workerStatsRes, proceduresRes, materialsRes] = await Promise.allSettled([
            api.get('/bookings/worker-stats'),
            api.get('/procedures'),
            api.get('/materials'),
          ])

          const workerStatsData = workerStatsRes.status === 'fulfilled' ? workerStatsRes.value.data : null
          const procedures = proceduresRes.status === 'fulfilled' ? proceduresRes.value.data : []
          const materials = materialsRes.status === 'fulfilled' ? materialsRes.value.data : []

          setWorkerStats(workerStatsData)
          setStats({
            bookings: { total: 0, pending: 0, confirmed: 0, completed: 0 },
            procedures: procedures.length,
            materials: materials.length,
          })
        } else {
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
              pending: bookings.filter((b: { status: string }) => b.status === 'held').length,
              confirmed: bookings.filter((b: { status: string }) => b.status === 'confirmed').length,
              completed: bookings.filter((b: { status: string }) => b.status === 'fulfilled').length,
            },
            clients: clients.length,
            procedures: procedures.length,
            materials: materials.length,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.role])

  const fetchUserDetails = async () => {
    setLoadingDetails(true)
    try {
      const { data } = await api.get('/auth/me')
      setUserDetails(data)
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load account details'
      toast('error', errorMessage)
    } finally {
      setLoadingDetails(false)
    }
  }

  const transformWorkerStats = (statsArray: Array<{ _id: string; count: number }>) => {
    const result = { total: 0, pending: 0, confirmed: 0, completed: 0 }
    statsArray.forEach((stat) => {
      result.total += stat.count
      if (stat._id === 'held') result.pending = stat.count
      if (stat._id === 'confirmed') result.confirmed = stat.count
      if (stat._id === 'fulfilled') result.completed = stat.count
    })
    return result
  }

  const handleOpenAccountModal = () => {
    setShowAccountModal(true)
    fetchUserDetails()
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your salon today.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={handleOpenAccountModal}>
            <User className="h-4 w-4 mr-2" />
            My Account
          </Button>
          {isConnected && (
            <div className="flex items-center text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              Live updates active
            </div>
          )}
        </div>
      </div>

      {user?.role === 'worker' && workerStats ? (
        <>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Personal Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const personalBookings = transformWorkerStats(workerStats.personalStats)
                return (
                  <>
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{personalBookings.total}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{personalBookings.pending}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{personalBookings.confirmed}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{personalBookings.completed}</p>
                          </div>
                          <CheckCircle className="h-12 w-12 text-purple-500 opacity-75" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Work Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const workBookings = transformWorkerStats(workerStats.workStats)
                return (
                  <>
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{workBookings.total}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{workBookings.pending}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{workBookings.confirmed}</p>
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
                            <p className="text-3xl font-bold text-gray-900 mt-1">{workBookings.completed}</p>
                          </div>
                          <CheckCircle className="h-12 w-12 text-purple-500 opacity-75" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          </div>
        </>
      ) : (
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
      )}

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

      {showAccountModal && (
        <Modal onClose={() => setShowAccountModal(false)} title="My Account">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{userDetails.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{userDetails.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <p className="text-gray-900 font-mono">{userDetails.password}</p>
              </div>
              {userDetails.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{userDetails.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{userDetails.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Tier</label>
                <p className="text-gray-900">{userDetails.loyaltyTier || 'None'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Visits</label>
                <p className="text-gray-900 font-semibold">{userDetails.visitsCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-4">Failed to load account details</p>
          )}
        </Modal>
      )}
    </div>
  )
}
