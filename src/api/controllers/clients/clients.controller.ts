import { Request, Response } from 'express'
import { Client } from '../../../database/models/client.model'

export const getAllClients = async (_req: Request, res: Response) => {
    const clients = await Client.find().sort({ name: 1 })
    res.json(clients)
}

export const createClient = async (req: Request, res: Response) => {
    const { name, email, phone } = req.body
    const client = await Client.create({ name, email, phone })
    res.status(201).json(client)
}

export const updateClient = async (req: Request, res: Response) => {
    const { id } = req.params
    const client = await Client.findById(id)
    
    if (!client) {
        return res.status(404).json({ error: 'Client not found' })
    }
    
    const { name, email, phone } = req.body
    if (name !== undefined) client.name = name
    if (email !== undefined) client.email = email
    if (phone !== undefined) client.phone = phone
    
    await client.save()
    res.json(client)
}

export const deleteClient = async (req: Request, res: Response) => {
    const { id } = req.params
    const client = await Client.findByIdAndDelete(id)
    
    if (!client) {
        return res.status(404).json({ error: 'Client not found' })
    }
    
    res.json({ ok: true, message: 'Client deleted' })
}
