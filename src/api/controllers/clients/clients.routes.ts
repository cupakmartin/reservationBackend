import { Router } from 'express'
import { Client } from '../../../database/models/client.model'
const router = Router()

router.get('/', async (_req, res) => res.json(await Client.find().sort({ name: 1 })))
router.post('/', async (req, res) => {
    const { name, email, phone } = req.body
    const doc = await Client.create({ name, email, phone })
    res.status(201).json(doc)
})

export default router
