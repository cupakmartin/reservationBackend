import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { payrollApi } from '../../lib/servicesApi'
import { Card } from '../../components/ui/Card'
import { DollarSign, TrendingUp } from 'lucide-react'

export default function WorkerFinancials() {
  const { user } = useAuthStore()
  const [earnings, setEarnings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    if (!user?.id) return
    
    try {
      const { data } = await payrollApi.getWorkerReport(user.id)
      setEarnings(data)
    } catch (error) {
      console.error('Failed to load earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Card><div className="p-4">Loading...</div></Card>
  }

  if (!earnings) {
    return null
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated Earnings This Month</p>
            <p className="text-3xl font-bold text-green-600">
              ${earnings.totalEarnings?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>{earnings.totalBookings || 0} completed bookings</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Commission rate: {((earnings.commissionRate || 0.5) * 100).toFixed(0)}%
        </div>
      </div>
    </Card>
  )
}
