import { Request, Response, NextFunction } from 'express'
export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
    console.error('❌ ERROR:', err.message);
    console.error('Stack:', err.stack);
    console.error('Path:', req.method, req.path);
    console.error('Query:', req.query);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
}
