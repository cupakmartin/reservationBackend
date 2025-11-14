// src/pages/Auth/Login.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'

export default function Login() {
  console.log('[Login] Rendering...')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      setTokens(data.accessToken, data.refreshToken)
      setUser({
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      })
      toast('success', 'Welcome back!')
      navigate('/')
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
    setTimeout(() => {
      const form = document.getElementById('login-form') as HTMLFormElement
      form?.requestSubmit()
    }, 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">GlowFlow Salon</div>
            <div className="text-lg font-normal text-gray-600">Sign in to your account</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-3 text-center">Quick login for testing:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => quickLogin('admin@test.com', '123456')}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => quickLogin('test@worker.com', '123456')}
              >
                Worker
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => quickLogin('test@client.com', '123456')}
              >
                Client
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
