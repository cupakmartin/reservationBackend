import { useState, useEffect } from 'react'
import { auditApi } from '../../lib/servicesApi'
import { Card } from '../../components/ui/Card'
import { format } from 'date-fns'
import { Shield, User, Calendar } from 'lucide-react'

interface AuditLog {
  _id: string
  timestamp: string
  actorId: {
    name: string
    email: string
    role: string
  }
  action: string
  resourceId?: string
  details?: any
  ipAddress?: string
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    dateFrom: '',
    dateTo: '',
    page: 1
  })
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    fetchActions()
    fetchLogs()
  }, [filters])

  const fetchActions = async () => {
    try {
      const { data } = await auditApi.getActionTypes()
      setActions(data)
    } catch (error) {
      console.error('Failed to load actions:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data } = await auditApi.getLogs(filters)
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              >
                <option value="">All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No audit logs found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{log.actorId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{log.actorId?.role || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.details && (
                        <pre className="text-xs overflow-auto max-w-md">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={pagination.page === 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
