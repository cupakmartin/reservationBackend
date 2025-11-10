import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import createError from 'http-errors'
import { registerRoutes } from './routes'
import { errorMiddleware } from './middleware/error'

export function createApp() {
    const app = express()
    app.use(helmet())
    app.use(cors())
    app.use(express.json())
    app.use(morgan('dev'))

    registerRoutes(app)

    app.use((_req, _res, next) => next(createError(404, 'Not found')))
    app.use(errorMiddleware)
    return app
}
