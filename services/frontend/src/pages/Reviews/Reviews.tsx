// src/pages/Reviews/Reviews.tsx
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import { Card, CardContent } from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { format } from 'date-fns'
import { Star, TrendingUp, Award, Users, Filter, X } from 'lucide-react'

interface Review {
  _id: string
  rating: number
  comment?: string
  createdAt: string
  clientId: {
    _id: string
    name: string
    email: string
    avatarUrl?: string
  }
  workerId?: {
    _id: string
    name: string
    email: string
    avatarUrl?: string
  }
  bookingId: {
    _id: string
    startsAt: string
    procedure?: {
      name: string
    }
  }
}

interface Stats {
  averageRating: number
  totalReviews: number
  fiveStars: number
  fourStars: number
  threeStars: number
  twoStars: number
  oneStar: number
}

export default function Reviews() {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({
    averageRating: 0,
    totalReviews: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  })
  const [loading, setLoading] = useState(true)
  const [workerFilter, setWorkerFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchReviews = async () => {
    try {
      const endpoint = isAdmin ? '/reviews/all-reviews' : '/reviews/my-reviews'
      const params = isAdmin && workerFilter ? `?workerName=${workerFilter}` : ''
      const { data } = await api.get(`${endpoint}${params}`)
      
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      toast('error', 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyFilter = () => {
    setLoading(true)
    fetchReviews()
  }

  const handleClearFilter = () => {
    setWorkerFilter('')
    setLoading(true)
    setTimeout(() => fetchReviews(), 0)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getStarPercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
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
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'All Reviews' : 'My Reviews'}
        </h1>
        {isAdmin && (
          <Button
            variant={showFilter ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilter ? 'Hide Filter' : 'Filter'}
          </Button>
        )}
      </div>

      {/* Admin Filter */}
      {isAdmin && showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Worker Name"
                  value={workerFilter}
                  onChange={(e) => setWorkerFilter(e.target.value)}
                  placeholder="Search by worker name..."
                />
              </div>
              <Button onClick={handleApplyFilter}>Apply</Button>
              <Button variant="secondary" onClick={handleClearFilter}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">5-Star Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.fiveStars}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getStarPercentage(stats.fiveStars).toFixed(0)}%
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Rating Distribution</p>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats[`${['oneStar', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][star - 1] as keyof Stats}` as keyof Stats] as number
                const percentage = getStarPercentage(count)
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-6">{star}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              {isAdmin 
                ? 'No reviews found matching the filter.'
                : 'You haven\'t received any reviews yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={review.clientId.name}
                    avatarUrl={review.clientId.avatarUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.clientId.name}
                        </h3>
                        <p className="text-sm text-gray-500">{review.clientId.email}</p>
                      </div>
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {isAdmin && review.workerId && (
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-gray-600">Worker:</span>
                        <Avatar
                          name={review.workerId.name}
                          avatarUrl={review.workerId.avatarUrl}
                          size="sm"
                        />
                        <span className="font-medium text-gray-900">{review.workerId.name}</span>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Procedure:</span>{' '}
                        {review.bookingId?.procedure?.name || 'N/A'} •{' '}
                        <span className="text-gray-500">
                          {format(new Date(review.bookingId.startsAt), 'MMM d, yyyy')}
                        </span>
                      </p>
                    </div>

                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 text-sm italic">"{review.comment}"</p>
                      </div>
                    )}
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
