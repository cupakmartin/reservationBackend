import { Request, Response, NextFunction } from 'express'
import { Procedure } from '../../../database/models/procedure.model'
import mongoose from 'mongoose'

interface QueryFilter {
    name?: { $regex: string; $options: string }
    durationMin?: { $gte: number }
    price?: { $gte: number }
    createdAt?: { $gte?: Date; $lte?: Date }
}

const buildProcedureFilter = (query: any): QueryFilter => {
    const filter: QueryFilter = {}
    
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' }
    }
    
    if (query.durationMin) {
        filter.durationMin = { $gte: parseFloat(query.durationMin) }
    }
    
    if (query.price) {
        filter.price = { $gte: parseFloat(query.price) }
    }
    
    if (query.dateFrom || query.dateTo) {
        filter.createdAt = {}
        if (query.dateFrom) {
            filter.createdAt.$gte = new Date(query.dateFrom)
        }
        if (query.dateTo) {
            filter.createdAt.$lte = new Date(query.dateTo)
        }
    }
    
    return filter
}

export const getAllProcedures = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter = buildProcedureFilter(req.query)
        const procedures = await Procedure.find(filter).sort({ name: 1 })
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
        const { name, description, durationMin, price } = req.body
        const procedure = await Procedure.create({ name, description, durationMin, price })
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
