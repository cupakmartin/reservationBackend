// Waitlist API endpoints
import api from './api'

export const waitlistApi = {
  async addToWaitlist(data: {
    date: string
    clientId: string
    workerId?: string
    procedureId: string
  }) {
    return await api.post('/services/waitlist/add', data).then(res => res.data)
  },

  async getClientWaitlist(clientId: string) {
    return await api.get(`/services/waitlist/list?clientId=${clientId}`).then(res => res.data)
  },

  async removeFromWaitlist(id: string) {
    return await api.delete(`/services/waitlist/remove/${id}`).then(res => res.data)
  }
}

export const payrollApi = {
  async getWorkerReport(workerId: string, month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    return await api.get(`/services/payroll/report/${workerId}?${params}`)
  },

  async getAllWorkersReport(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    return await api.get(`/services/payroll/reports/all?${params}`)
  },

  async setCommissionRate(workerId: string, rate: number) {
    return await api.put(`/services/payroll/rates/${workerId}`, { 
      workerId, 
      rate 
    })
  }
}

export const auditApi = {
  async getLogs(filters?: {
    actorId?: string
    action?: string
    dateFrom?: string
    dateTo?: string
    resourceId?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })
    }
    return await api.get(`/services/audit/logs?${params}`)
  },

  async getActionTypes() {
    return await api.get('/services/audit/actions')
  }
}
