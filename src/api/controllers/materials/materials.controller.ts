import { Request, Response, NextFunction } from 'express'
import { Material } from '../../../database/models/material.model'
import mongoose from 'mongoose'

export const getAllMaterials = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const materials = await Material.find().sort({ name: 1 })
        res.json(materials)
    } catch (error) {
        next(error)
    }
}

export const getMaterialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        const material = await Material.findById(req.params.id)
        
        if (!material) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        res.json(material)
    } catch (error) {
        next(error)
    }
}

export const createMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, unit, stockOnHand } = req.body
        const material = await Material.create({ name, unit, stockOnHand })
        res.status(201).json(material)
    } catch (error) {
        next(error)
    }
}

export const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        
        if (!material) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        res.json(material)
    } catch (error) {
        next(error)
    }
}

export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        const material = await Material.findByIdAndDelete(req.params.id)
        
        if (!material) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        res.json({ ok: true, message: 'Material deleted' })
    } catch (error) {
        next(error)
    }
}
