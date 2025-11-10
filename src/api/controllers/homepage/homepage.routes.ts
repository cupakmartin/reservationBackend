// src/api/controllers/homepage/homepage.routes.ts
import { Router } from 'express'
const router = Router()

router.get('/', (_req, res) => {
    res.json({ 
        ok: true, 
        name: 'GlowFlow API', 
        version: '0.1.0' 
    })
})

export default router
