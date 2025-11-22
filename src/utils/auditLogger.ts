import axios from 'axios'

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://audit-service:4004'

interface AuditLogData {
  actorId: string
  action: string
  resourceId?: string
  details?: any
  ipAddress?: string
}

export const logAudit = async (data: AuditLogData): Promise<void> => {
  try {
    await axios.post(`${AUDIT_SERVICE_URL}/log`, data, {
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to send audit log:', error)
  }
}

export const AuditActions = {
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_STATUS_CHANGED: 'BOOKING_STATUS_CHANGED',
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_UPDATED: 'CLIENT_UPDATED',
  CLIENT_DELETED: 'CLIENT_DELETED',
  MATERIAL_CREATED: 'MATERIAL_CREATED',
  MATERIAL_UPDATED: 'MATERIAL_UPDATED',
  MATERIAL_DELETED: 'MATERIAL_DELETED',
  PROCEDURE_CREATED: 'PROCEDURE_CREATED',
  PROCEDURE_UPDATED: 'PROCEDURE_UPDATED',
  PROCEDURE_DELETED: 'PROCEDURE_DELETED',
  LOYALTY_TIER_CHANGED: 'LOYALTY_TIER_CHANGED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT'
} as const
