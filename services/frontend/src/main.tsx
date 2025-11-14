import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

console.log('[main.tsx] Starting application...')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const rootElement = document.getElementById('root')
console.log('[main.tsx] Root element:', rootElement)

if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Root element not found!</div>'
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>,
    )
    console.log('[main.tsx] Application rendered successfully')
  } catch (error) {
    console.error('[main.tsx] Error rendering:', error)
    document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: ' + error + '</div>'
  }
}
