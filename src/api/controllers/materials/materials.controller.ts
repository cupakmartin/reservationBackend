import { Request, Response } from 'express'
import { Material } from '../../../database/models/material.model'

export const getAllMaterials = async (_req: Request, res: Response) => {
    const materials = await Material.find().sort({ name: 1 })
    res.json(materials)
}

export const createMaterial = async (req: Request, res: Response) => {
    const { name, unit, stockOnHand } = req.body
    const material = await Material.create({ name, unit, stockOnHand })
    res.status(201).json(material)
}
