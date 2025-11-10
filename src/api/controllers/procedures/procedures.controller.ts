import { Request, Response } from 'express'
import { Procedure } from '../../../database/models/procedure.model'

export const getAllProcedures = async (_req: Request, res: Response) => {
    const procedures = await Procedure.find().sort({ name: 1 })
    res.json(procedures)
}

export const createProcedure = async (req: Request, res: Response) => {
    const { name, durationMin, price } = req.body
    const procedure = await Procedure.create({ name, durationMin, price })
    res.status(201).json(procedure)
}

export const updateProcedureBOM = async (req: Request, res: Response) => {
    const procedure = await Procedure.findById(req.params.id)
    
    if (!procedure) {
        return res.status(404).json({ error: 'Procedure not found' })
    }
    
    procedure.bom = req.body || []
    await procedure.save()
    res.json({ ok: true })
}
