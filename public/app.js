const API_BASE = '/api'

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
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
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
