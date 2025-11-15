const API_BASE = '/api'

// Authentication state
let accessToken = localStorage.getItem('accessToken')
let refreshTokenValue = localStorage.getItem('refreshToken')
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')

// Update UI with current auth state
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo')
    const logoutBtn = document.getElementById('logoutBtn')
    
    if (currentUser) {
        userInfo.textContent = `Logged in as: ${currentUser.name} (${currentUser.role})`
        logoutBtn.style.display = 'inline-block'
    } else {
        userInfo.textContent = 'Not logged in'
        logoutBtn.style.display = 'none'
    }
}

// Logout function
function logout() {
    accessToken = null
    refreshTokenValue = null
    currentUser = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
    updateAuthUI()
    displayResponse({ message: 'Logged out successfully' })
}

// Quick login function
async function quickLogin(email, password) {
    const formData = { email, password }
    const loginForm = document.getElementById('loginForm')
    
    // Populate form
    loginForm.email.value = email
    loginForm.password.value = password
    
    // Submit
    await handleLogin(formData)
}

// Refresh token function
async function refreshToken() {
    if (!refreshTokenValue) {
        displayResponse({ error: 'No refresh token available. Please login first.' }, true)
        return
    }
    
    const data = await handleFetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue })
    })
    
    if (data && data.accessToken) {
        accessToken = data.accessToken
        localStorage.setItem('accessToken', accessToken)
        displayResponse({ message: 'Token refreshed successfully', user: data.user })
    }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
        
        btn.classList.add('active')
        document.getElementById(targetTab).classList.add('active')
    })
})

// Helper function to display response
function displayResponse(data, isError = false) {
    const responseEl = document.getElementById('response')
    responseEl.className = isError ? 'error' : 'success'
    responseEl.textContent = JSON.stringify(data, null, 2)
}

// Helper function to handle fetch errors
async function handleFetch(url, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }
        
        // Add Authorization header if we have a token
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            displayResponse({ status: response.status, ...data }, true)
        } else {
            displayResponse(data)
        }
        
        return data
    } catch (error) {
        displayResponse({ error: error.message }, true)
    }
}

// AUTHENTICATION API
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    const result = await handleFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    if (result && result.accessToken) {
        accessToken = result.accessToken
        refreshTokenValue = result.refreshToken
        currentUser = result.user
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshTokenValue)
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
        updateAuthUI()
        e.target.reset()
    }
})

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    await handleLogin(data)
    e.target.reset()
})

async function handleLogin(data) {
    const result = await handleFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    if (result && result.accessToken) {
        accessToken = result.accessToken
        refreshTokenValue = result.refreshToken
        currentUser = result.user
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshTokenValue)
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
        updateAuthUI()
    }
}

// Initialize auth UI on page load
updateAuthUI()

// CLIENTS API
document.getElementById('createClientForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    
    await handleFetch(`${API_BASE}/clients`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function getAllClients() {
    await handleFetch(`${API_BASE}/clients`)
}

async function getClientById() {
    const id = document.getElementById('getClientId').value
    if (!id) return alert('Please enter Client ID')
    await handleFetch(`${API_BASE}/clients/${id}`)
}

document.getElementById('updateClientForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    const id = data.id
    delete data.id
    
    // Remove empty fields
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key]
    })
    
    await handleFetch(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function deleteClient() {
    const id = document.getElementById('deleteClientId').value
    if (!id) return alert('Please enter Client ID')
    if (!confirm('Are you sure you want to delete this client?')) return
    
    await handleFetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' })
    document.getElementById('deleteClientId').value = ''
}

// MATERIALS API
document.getElementById('createMaterialForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    data.stockOnHand = Number(data.stockOnHand)
    
    await handleFetch(`${API_BASE}/materials`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function getAllMaterials() {
    await handleFetch(`${API_BASE}/materials`)
}

async function getMaterialById() {
    const id = document.getElementById('getMaterialId').value
    if (!id) return alert('Please enter Material ID')
    await handleFetch(`${API_BASE}/materials/${id}`)
}

document.getElementById('updateMaterialForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    const id = data.id
    delete data.id
    
    // Remove empty fields and convert stockOnHand to number
    Object.keys(data).forEach(key => {
        if (data[key] === '') {
            delete data[key]
        } else if (key === 'stockOnHand') {
            data[key] = Number(data[key])
        }
    })
    
    await handleFetch(`${API_BASE}/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function deleteMaterial() {
    const id = document.getElementById('deleteMaterialId').value
    if (!id) return alert('Please enter Material ID')
    if (!confirm('Are you sure you want to delete this material?')) return
    
    await handleFetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' })
    document.getElementById('deleteMaterialId').value = ''
}

// PROCEDURES API
document.getElementById('createProcedureForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    data.durationMin = Number(data.durationMin)
    data.price = Number(data.price)
    
    await handleFetch(`${API_BASE}/procedures`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function getAllProcedures() {
    await handleFetch(`${API_BASE}/procedures`)
}

async function getProcedureById() {
    const id = document.getElementById('getProcedureId').value
    if (!id) return alert('Please enter Procedure ID')
    await handleFetch(`${API_BASE}/procedures/${id}`)
}

document.getElementById('updateProcedureForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    const id = data.id
    delete data.id
    
    // Remove empty fields and convert numbers
    Object.keys(data).forEach(key => {
        if (data[key] === '') {
            delete data[key]
        } else if (key === 'durationMin' || key === 'price') {
            data[key] = Number(data[key])
        }
    })
    
    await handleFetch(`${API_BASE}/procedures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function deleteProcedure() {
    const id = document.getElementById('deleteProcedureId').value
    if (!id) return alert('Please enter Procedure ID')
    if (!confirm('Are you sure you want to delete this procedure?')) return
    
    await handleFetch(`${API_BASE}/procedures/${id}`, { method: 'DELETE' })
    document.getElementById('deleteProcedureId').value = ''
}

async function updateProcedureBOM() {
    const id = document.getElementById('bomProcedureId').value
    const bomData = document.getElementById('bomData').value
    
    if (!id) return alert('Please enter Procedure ID')
    if (!bomData) return alert('Please enter BOM data')
    
    try {
        const bom = JSON.parse(bomData)
        await handleFetch(`${API_BASE}/procedures/${id}/bom`, {
            method: 'POST',
            body: JSON.stringify(bom)
        })
    } catch (error) {
        displayResponse({ error: 'Invalid JSON format' }, true)
    }
}

// BOOKINGS API
document.getElementById('createBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    
    // Convert datetime-local to ISO string
    data.startsAt = new Date(data.startsAt).toISOString()
    data.endsAt = new Date(data.endsAt).toISOString()
    
    await handleFetch(`${API_BASE}/bookings`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function getAllBookings() {
    await handleFetch(`${API_BASE}/bookings`)
}

async function getBookingById() {
    const id = document.getElementById('getBookingId').value
    if (!id) return alert('Please enter Booking ID')
    await handleFetch(`${API_BASE}/bookings/${id}`)
}

document.getElementById('updateBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    const id = data.id
    delete data.id
    
    // Remove empty fields
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key]
    })
    
    await handleFetch(`${API_BASE}/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    
    e.target.reset()
})

async function deleteBooking() {
    const id = document.getElementById('deleteBookingId').value
    if (!id) return alert('Please enter Booking ID')
    if (!confirm('Are you sure you want to delete this booking?')) return
    
    await handleFetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' })
    document.getElementById('deleteBookingId').value = ''
}

async function updateBookingStatus() {
    const id = document.getElementById('statusBookingId').value
    const status = document.getElementById('newStatus').value
    
    if (!id) return alert('Please enter Booking ID')
    
    await handleFetch(`${API_BASE}/bookings/${id}/status/${status}`, {
        method: 'PATCH'
    })
}

async function getCalendar() {
    const month = document.getElementById('calendarMonth').value
    const year = document.getElementById('calendarYear').value
    
    if (!month || !year) return alert('Please enter both month and year')
    
    await handleFetch(`${API_BASE}/bookings/calendar?month=${month}&year=${year}`)
}

// WebSocket functionality
let socket = null
let isConnecting = false

function toggleWebSocket() {
    if (socket && socket.connected) {
        disconnectWebSocket()
    } else {
        connectWebSocket()
    }
}

function connectWebSocket() {
    if (!accessToken) {
        alert('Please login first to connect WebSocket')
        return
    }
    
    if (isConnecting) return
    isConnecting = true
    
    updateWSStatus('🟡 Connecting...', true)
    
    // Load Socket.IO from CDN if not already loaded
    if (typeof io === 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => initWebSocket()
        script.onerror = () => {
            isConnecting = false
            updateWSStatus('🔴 Failed to load Socket.IO', false)
        }
        document.head.appendChild(script)
    } else {
        initWebSocket()
    }
}

function initWebSocket() {
    try {
        socket = io('http://localhost:4000', {
            auth: {
                token: accessToken
            }
        })
        
        socket.on('connect', () => {
            isConnecting = false
            updateWSStatus('🟢 Connected', true)
            addWSEvent('✅ Connected to WebSocket server')
        })
        
        socket.on('disconnect', () => {
            updateWSStatus('🔴 Disconnected', false)
            addWSEvent('❌ Disconnected from server')
        })
        
        socket.on('connect_error', (error) => {
            isConnecting = false
            updateWSStatus('🔴 Connection error', false)
            addWSEvent(`❌ Error: ${error.message}`)
        })
        
        socket.on('bookings:updated', (data) => {
            addWSEvent(`📅 Booking ${data.event}: ${JSON.stringify(data.data)}`)
            displayResponse(data, false)
        })
        
        socket.on('pong', () => {
            addWSEvent('🏓 Pong received')
        })
        
    } catch (error) {
        isConnecting = false
        updateWSStatus('🔴 Connection failed', false)
        addWSEvent(`❌ Error: ${error.message}`)
    }
}

function disconnectWebSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
        updateWSStatus('⚪ Not connected', false)
        addWSEvent('👋 Disconnected')
    }
}

function updateWSStatus(text, isConnected) {
    const indicator = document.getElementById('wsIndicator')
    const toggle = document.getElementById('wsToggle')
    
    indicator.textContent = text
    toggle.textContent = isConnected ? 'Disconnect' : 'Connect'
}

function addWSEvent(message) {
    const eventsDiv = document.getElementById('wsEvents')
    const timestamp = new Date().toLocaleTimeString()
    const eventLine = document.createElement('div')
    eventLine.textContent = `[${timestamp}] ${message}`
    eventLine.style.marginBottom = '4px'
    eventsDiv.appendChild(eventLine)
    eventsDiv.scrollTop = eventsDiv.scrollHeight
    
    // Keep only last 50 events
    while (eventsDiv.children.length > 50) {
        eventsDiv.removeChild(eventsDiv.firstChild)
    }
}

// ============================================
// MAILING SERVICE API
// ============================================

const MAILING_SERVICE_URL = 'http://localhost:4001'

async function checkMailingServiceHealth() {
    try {
        const response = await fetch(`${MAILING_SERVICE_URL}/health`)
        const data = await response.json()
        displayResponse(data)
    } catch (error) {
        displayResponse({ 
            error: 'Cannot connect to Mailing Service',
            message: 'Make sure the service is running on port 4001',
            hint: 'cd services/mailing-service && npm start'
        }, true)
    }
}

document.getElementById('sendEmailForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
        to: formData.get('to'),
        subject: formData.get('subject'),
        html: formData.get('html')
    }
    
    try {
        const response = await fetch(`${MAILING_SERVICE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        
        const result = await response.json()
        
        if (response.ok) {
            displayResponse({
                ...result,
                message: '✅ Email sent successfully!',
                hint: 'Check the preview URL or login to Ethereal Email to view the message'
            })
        } else {
            displayResponse(result, true)
        }
    } catch (error) {
        displayResponse({ 
            error: 'Cannot connect to Mailing Service',
            message: error.message,
            hint: 'Make sure the service is running: cd services/mailing-service && npm start'
        }, true)
    }
})

// Clear response function
function clearResponse() {
    const responseEl = document.getElementById('response')
    responseEl.textContent = ''
    responseEl.className = ''
}

// Initialize auth UI on load
updateAuthUI()
