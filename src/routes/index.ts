import { Express } from 'express'

import homepage from '../api/controllers/homepage/homepage.routes'
import auth from '../api/controllers/auth/auth.routes'
import clients from '../api/controllers/clients/clients.routes'
import materials from '../api/controllers/materials/materials.routes'
import procedures from '../api/controllers/procedures/procedures.routes'
import bookings from '../api/controllers/bookings/bookings.routes'
import reviews from '../api/controllers/reviews/reviews.routes'
import adminEmail from '../api/controllers/admin/email.routes'
import services from '../api/controllers/services/services.routes'

import docs from '../api/controllers/docs/docs.routes'

export function registerRoutes(app: Express) {
    app.use('/api-info', homepage)
    app.use('/api/auth', auth)
    app.use('/api/clients', clients)
    app.use('/api/materials', materials)
    app.use('/api/procedures', procedures)
    app.use('/api/bookings', bookings)
    app.use('/api/reviews', reviews)
    app.use('/api/admin', adminEmail)
    app.use('/api/services', services)

    app.use('/docs', docs)
}
