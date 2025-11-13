import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import createError from 'http-errors'
import path from 'path'
import { registerRoutes } from './routes'
import { errorMiddleware } from './middleware/error'

export function createApp() {
    const app = express()
    
    // Configure Helmet with proper CSP for Swagger UI
    app.use(helmet({
        contentSecurityPolicy: false
    }))
    
    app.use(cors())
    app.use(express.json())
    
    // Only log HTTP requests in development when not running tests
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'))
    }

    registerRoutes(app)

    // Serve static files from public directory (frontend UI)
    app.use(express.static(path.join(__dirname, '../public')))

    app.use((_req, _res, next) => next(createError(404, 'Not found')))
    app.use(errorMiddleware)
    return app
}
