import { Router } from 'express'
import { Material } from '../../../database/models/material.model'
const router = Router()

router.get('/', async (_req, res) => res.json(await Material.find().sort({ name: 1 })))
router.post('/', async (req, res) => {
    const { name, unit, stockOnHand } = req.body
    const doc = await Material.create({ name, unit, stockOnHand })
    res.status(201).json(doc)
})

export default router
