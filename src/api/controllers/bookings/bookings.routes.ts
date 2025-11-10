import { Router } from 'express'
import { Booking } from '../../../database/models/booking.model'
import { Procedure } from '../../../database/models/procedure.model'
import { Material } from '../../../database/models/material.model'
import { Client } from '../../../database/models/client.model'
import { applyLoyaltyAfterFulfilled } from '../../../services/loyalty.service'
import { sendEmail } from '../../../services/notifications.service'

const router = Router()

router.get('/', async (_req, res) => {
    const docs = await Booking.find().sort({ createdAt: -1 }).limit(50)
    res.json(docs)
})

router.post('/', async (req, res) => {
    const doc = await Booking.create(req.body)
    const client = await Client.findById(doc.clientId)
    await sendEmail(client?.email, 'Your booking', `<p>Status: <b>${doc.status}</b></p>`)
    await sendEmail(process.env.OWNER_EMAIL, 'New booking', `<p>Client: ${client?.name || doc.clientId}</p>`)
    res.status(201).json(doc)
})

router.patch('/:id/status/:newStatus', async (req, res) => {
    const { id, newStatus } = req.params
    const doc = await Booking.findById(id); if (!doc) return res.status(404).json({ error: 'Not found' })
    doc.status = newStatus as any
    await doc.save()

    if (newStatus === 'fulfilled') {
        const proc = await Procedure.findById(doc.procedureId)
        if (proc) {
            for (const item of proc.bom) {
                await Material.updateOne({ _id: item.materialId }, { $inc: { stockOnHand: -Number(item.qtyPerProcedure) } })
            }
        }
        await applyLoyaltyAfterFulfilled(String(doc.clientId))
    }
    res.json(doc)
})

export default router
