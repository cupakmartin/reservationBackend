import { Request, Response, NextFunction } from 'express'
import { Procedure } from '../../../database/models/procedure.model'
import mongoose from 'mongoose'

export const getAllProcedures = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const procedures = await Procedure.find().sort({ name: 1 })
        res.json(procedures)
    } catch (error) {
        next(error)
    }
}

export const getProcedureById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        const procedure = await Procedure.findById(req.params.id)
        
        if (!procedure) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        res.json(procedure)
    } catch (error) {
        next(error)
    }
}

export const createProcedure = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, durationMin, price } = req.body
        const procedure = await Procedure.create({ name, durationMin, price })
        res.status(201).json(procedure)
    } catch (error) {
        next(error)
    }
}

export const updateProcedure = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        const procedure = await Procedure.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        
        if (!procedure) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        res.json(procedure)
    } catch (error) {
        next(error)
    }
}

export const deleteProcedure = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        const procedure = await Procedure.findByIdAndDelete(req.params.id)
        
        if (!procedure) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        res.json({ ok: true, message: 'Procedure deleted' })
    } catch (error) {
        next(error)
    }
}

export const updateProcedureBOM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        const procedure = await Procedure.findById(req.params.id)
        
        if (!procedure) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        procedure.bom = req.body || []
        await procedure.save()
        res.json({ ok: true })
    } catch (error) {
        next(error)
    }
}
