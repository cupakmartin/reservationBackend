// src/components/Layout.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, Calendar, Users, Package, Clipboard, Home, CalendarCheck, CheckCircle, BarChart3, Upload, Star, Mail, Clock, DollarSign, Shield } from 'lucide-react'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import UploadModal from './ui/UploadModal'
import { useState } from 'react'
import api from '../lib/api'
import { toast } from './ui/Toast'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUploadModal, setShowUploadModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    const { data } = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (user) {
      setUser({ ...user, avatarUrl: data.avatarUrl })
    }

    toast('success', 'Avatar updated successfully!')
  }

  const isActive = (path: string) => location.pathname === path

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['client', 'worker', 'admin'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['client', 'worker', 'admin'] },
    { name: 'Bookings', href: '/bookings', icon: Clipboard, roles: ['client', 'worker', 'admin'] },
    { name: 'My Schedule', href: '/my-schedule', icon: CalendarCheck, roles: ['worker'] },
    { name: 'My Waitlist', href: '/my-waitlist', icon: Clock, roles: ['client'] },
    { name: 'My Financials', href: '/my-financials', icon: DollarSign, roles: ['worker'] },
    { name: 'Completed Bookings', href: '/completed-bookings', icon: CheckCircle, roles: ['client', 'worker'] },
    { name: 'Reviews', href: '/reviews', icon: Star, roles: ['worker', 'admin'] },
    { name: 'Procedures', href: '/procedures', icon: Package, roles: ['worker', 'admin'] },
    { name: 'Clients', href: '/clients', icon: Users, roles: ['admin'] },
    { name: 'Materials', href: '/materials', icon: Package, roles: ['worker', 'admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin'] },
    { name: 'Payroll', href: '/admin/payroll', icon: DollarSign, roles: ['admin'] },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: Shield, roles: ['admin'] },
    { name: 'Email Settings', href: '/admin/emails', icon: Mail, roles: ['admin'] },
  ]

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">GlowFlow Salon</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar 
                  name={user?.name || ''} 
                  avatarUrl={user?.avatarUrl}
                  size="md"
                  className="cursor-pointer"
                />
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload avatar"
                >
                  <Upload className="h-3 w-3 text-white" />
                </button>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleAvatarUpload}
          title="Upload Profile Picture"
          accept="image/*"
          maxSize={5}
        />
      )}
    </div>
  )
}
