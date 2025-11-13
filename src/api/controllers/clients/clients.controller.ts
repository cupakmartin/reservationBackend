import { Response, NextFunction } from 'express'
import { Client } from '../../../database/models/client.model'
import { AuthRequest } from '../../../middleware/auth'
import mongoose from 'mongoose'

export const getAllClients = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const clients = await Client.find().sort({ name: 1 })
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
