import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { waitlistApi } from '../../lib/servicesApi'
import { toast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Clock, Trash2, User } from 'lucide-react'
import { format } from 'date-fns'

interface WaitlistEntry {
  _id: string
  date: string
  procedureId: {
    name: string
    duration: number
    price: number
  }
  workerId?: {
    name: string
  }
  createdAt: string
}

export default function MyWaitlist() {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const fetchWaitlist = async () => {
    if (!user?.id) return
    
    try {
      const data = await waitlistApi.getClientWaitlist(user.id)
      setEntries(data)
    } catch (error) {
      toast('error', 'Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await waitlistApi.removeFromWaitlist(id)
      toast('success', 'Removed from waitlist')
      fetchWaitlist()
    } catch (error) {
      toast('error', 'Failed to remove entry')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (entries.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>You're not on any waitlists</p>
          <p className="text-sm mt-2">Join a waitlist when your preferred time slot is full</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <Card key={entry._id}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">
                  {format(new Date(entry.date), 'MMM dd, yyyy')}
                </span>
              </div>
              <p className="text-lg font-medium">{entry.procedureId.name}</p>
              {entry.workerId && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <User className="w-4 h-4" />
                  <span>{entry.workerId.name}</span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Added {format(new Date(entry.createdAt), 'MMM dd')}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRemove(entry._id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
