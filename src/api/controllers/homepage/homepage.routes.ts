// src/api/controllers/homepage/homepage.routes.ts
import { Router, Request, Response, NextFunction } from 'express'
const router = Router

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
}

export default router
