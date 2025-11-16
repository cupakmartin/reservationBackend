// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import { ToastContainer } from './components/ui/Toast'

// Auth pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// Main pages
import Dashboard from './pages/Dashboard/Dashboard'
import Calendar from './pages/Calendar/Calendar'
import Bookings from './pages/Bookings/Bookings'
import MySchedule from './pages/MySchedule/MySchedule'
import CompletedBookings from './pages/CompletedBookings/CompletedBookings'
import Procedures from './pages/Procedures/Procedures'
import Clients from './pages/Clients/Clients'
import Materials from './pages/Materials/Materials'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  console.log('[App] Rendering...')
  
  // Temporary debug check
  try {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/my-schedule" element={<MySchedule />} />
                    <Route path="/completed-bookings" element={<CompletedBookings />} />
                    <Route path="/procedures" element={<Procedures />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/materials" element={<Materials />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer />
      </>
    )
  } catch (error) {
    console.error('[App] Error rendering:', error)
    return <div style={{color: 'red', padding: '20px'}}>Error: {String(error)}</div>
  }
}

export default App
