import express from 'express'
import axios from 'axios'

const router = express.Router()

const WAITLIST_SERVICE_URL = process.env.WAITLIST_SERVICE_URL || 'http://waitlist-service:4002'
const PAYROLL_SERVICE_URL = process.env.PAYROLL_SERVICE_URL || 'http://payroll-service:4003'
const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://audit-service:4004'

// Waitlist proxy routes
router.post('/waitlist', async (req, res, next) => {
  try {
    const { data } = await axios.post(`${WAITLIST_SERVICE_URL}/waitlist`, req.body)
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

router.get('/waitlist/client/:clientId', async (req, res, next) => {
  try {
    const { data } = await axios.get(`${WAITLIST_SERVICE_URL}/waitlist/client/${req.params.clientId}`)
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/waitlist/:id', async (req, res, next) => {
  try {
    const { data } = await axios.delete(`${WAITLIST_SERVICE_URL}/waitlist/${req.params.id}`)
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

// Payroll proxy routes
router.get('/payroll/report/:workerId', async (req, res, next) => {
  try {
    const { data } = await axios.get(`${PAYROLL_SERVICE_URL}/report/${req.params.workerId}`, {
      params: req.query
    })
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

router.get('/payroll/reports/all', async (req, res, next) => {
  try {
    const { data } = await axios.get(`${PAYROLL_SERVICE_URL}/reports/all`, {
      params: req.query
    })
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

router.put('/payroll/rates/:workerId', async (req, res, next) => {
  try {
    const { data } = await axios.put(`${PAYROLL_SERVICE_URL}/rates/${req.params.workerId}`, req.body)
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

// Audit proxy routes
router.get('/audit/logs', async (req, res, next) => {
  try {
    const { data } = await axios.get(`${AUDIT_SERVICE_URL}/logs`, {
      params: req.query
    })
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

router.get('/audit/actions', async (req, res, next) => {
  try {
    const { data } = await axios.get(`${AUDIT_SERVICE_URL}/actions`)
    res.json(data)
  } catch (error: any) {
    next(error)
  }
})

export default router
