import { Response, NextFunction } from 'express'
import { Client } from '../../../database/models/client.model'
import { AuthRequest } from '../../../middleware/auth'
import mongoose from 'mongoose'

interface QueryFilter {
    name?: { $regex: string; $options: string }
    role?: string
    loyaltyPoints?: { $gte: number }
    createdAt?: { $gte?: Date; $lte?: Date }
}

const buildClientFilter = (query: any): QueryFilter => {
    const filter: QueryFilter = {}
    
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' }
    }
    
    if (query.role) {
        filter.role = query.role
    }
    
    if (query.loyaltyPoints) {
        filter.loyaltyPoints = { $gte: parseFloat(query.loyaltyPoints) }
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

export const getAllClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filter = buildClientFilter(req.query)
        
        // Dynamic sorting
        const sortBy = req.query.sortBy as string || 'name'
        const order = req.query.order as string || 'asc'
        const sortOptions: Record<string, 1 | -1> = { [sortBy]: order === 'asc' ? 1 : -1 }
        
        const clients = await Client.find(filter).sort(sortOptions)
        res.json(clients)
    } catch (error) {
        next(error)
    }
}

export const getClientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        // Clients can only view their own profile unless they're admin/worker
        if (req.user?.role === 'client' && req.user.userId !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' })
        }
        
        const client = await Client.findById(req.params.id)
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        res.json(client)
    } catch (error) {
        next(error)
    }
}

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, email, phone } = req.body
        const client = await Client.create({ name, email, phone })
        res.status(201).json(client)
    } catch (error) {
        next(error)
    }
}

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        // Clients cannot change their own role
        if (req.user?.role === 'client' && req.body.role) {
            return res.status(403).json({ error: 'You cannot change your own role' })
        }
        
        const client = await Client.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        res.json(client)
    } catch (error) {
        next(error)
    }
}

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        const client = await Client.findByIdAndDelete(id)
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        res.json({ ok: true, message: 'Client deleted' })
    } catch (error) {
        next(error)
    }
}
