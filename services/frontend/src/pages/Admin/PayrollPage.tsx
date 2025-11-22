import { useState, useEffect } from 'react'
import { payrollApi } from '../../lib/servicesApi'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DollarSign, Users, TrendingUp } from 'lucide-react'
import { toast } from '../../components/ui/Toast'

interface WorkerReport {
  workerId: string
  workerName: string
  commissionRate: number
  totalBookings: number
  totalEarnings: number
}

export default function PayrollPage() {
  const [reports, setReports] = useState<WorkerReport[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [newRate, setNewRate] = useState('')

  useEffect(() => {
    fetchReports()
  }, [month, year])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data } = await payrollApi.getAllWorkersReport(month, year)
      setReports(data.workers)
    } catch (error) {
      toast('error', 'Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRate = async (workerId: string) => {
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast('error', 'Rate must be between 0 and 1')
      return
    }

    try {
      await payrollApi.setCommissionRate(workerId, rate)
      toast('success', 'Commission rate updated')
      setEditingRate(null)
      fetchReports()
    } catch (error) {
      toast('error', 'Failed to update rate')
    }
  }

  const totalEarnings = reports.reduce((sum, r) => sum + r.totalEarnings, 0)
  const totalBookings = reports.reduce((sum, r) => sum + r.totalBookings, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold">Payroll Management</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded-md"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded-md"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Workers</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Worker</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Commission Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Bookings</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total Earnings</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map(report => (
                  <tr key={report.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{report.workerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      {editingRate === report.workerId ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            className="w-20 px-2 py-1 border rounded"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRate(report.workerId)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingRate(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span>{(report.commissionRate * 100).toFixed(0)}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{report.totalBookings}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ${report.totalEarnings.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {editingRate !== report.workerId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingRate(report.workerId)
                            setNewRate(report.commissionRate.toString())
                          }}
                        >
                          Edit Rate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
