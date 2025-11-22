import { Request, Response, NextFunction } from 'express'
import { Material } from '../../../database/models/material.model'
import mongoose from 'mongoose'
import { logAudit, AuditActions } from '../../../utils/auditLogger'
import { AuthRequest } from '../../../middleware/auth'

interface QueryFilter {
    name?: { $regex: string; $options: string }
    unit?: string
    stockOnHand?: { $gte: number }
    createdAt?: { $gte?: Date; $lte?: Date }
}

const buildMaterialFilter = (query: any): QueryFilter => {
    const filter: QueryFilter = {}
    
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' }
    }
    
    if (query.unit) {
        filter.unit = query.unit
    }
    
    if (query.stockOnHand) {
        filter.stockOnHand = { $gte: parseFloat(query.stockOnHand) }
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

export const getAllMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter = buildMaterialFilter(req.query)
        
        // Dynamic sorting
        const sortBy = req.query.sortBy as string || 'name'
        const order = req.query.order as string || 'asc'
        const sortOptions: Record<string, 1 | -1> = { [sortBy]: order === 'asc' ? 1 : -1 }
        
        const materials = await Material.find(filter).sort(sortOptions)
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

export const deleteMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        const material = await Material.findByIdAndDelete(req.params.id)
        
        if (!material) {
            return res.status(404).json({ error: 'Material not found' })
        }
        
        if (req.user?.userId) {
            logAudit({
                actorId: req.user.userId,
                action: AuditActions.MATERIAL_DELETED,
                resourceId: req.params.id,
                details: { name: material.name, unit: material.unit },
                ipAddress: req.ip
            }).catch(err => console.error('Audit log failed:', err))
        }
        
        res.json({ ok: true, message: 'Material deleted' })
    } catch (error) {
        next(error)
    }
}
