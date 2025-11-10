import { Router } from 'express'
import { Procedure } from '../../../database/models/procedure.model'
const router = Router()

router.get('/', async (_req, res) => res.json(await Procedure.find().sort({ name: 1 })))
router.post('/', async (req, res) => {
    const { name, durationMin, price } = req.body
    const doc = await Procedure.create({ name, durationMin, price })
    res.status(201).json(doc)
})
router.post('/:id/bom', async (req, res) => {
    const proc = await Procedure.findById(req.params.id)
    if (!proc) return res.status(404).json({ error: 'Not found' })
    proc.bom = req.body || []
    await proc.save()
    res.json({ ok: true })
})

export default router
