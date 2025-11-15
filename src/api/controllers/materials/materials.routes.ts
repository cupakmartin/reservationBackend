import { Router } from 'express'
import { validate, createMaterialSchema, updateMaterialSchema } from '../../../middleware/validation'
import { authenticate, checkRole } from '../../../middleware/auth'
import { 
    getAllMaterials, 
    getMaterialById,
    createMaterial, 
    updateMaterial,
    deleteMaterial 
} from './materials.controller'

const router = Router()

// Only workers and admins can view materials
router.get('/', authenticate, checkRole(['worker', 'admin']), getAllMaterials)
router.get('/:id', authenticate, checkRole(['worker', 'admin']), getMaterialById)

// Workers and admins can create, update, or delete materials
router.post('/', authenticate, checkRole(['admin', 'worker']), validate(createMaterialSchema), createMaterial)
router.put('/:id', authenticate, checkRole(['admin', 'worker']), validate(updateMaterialSchema), updateMaterial)
router.delete('/:id', authenticate, checkRole(['admin', 'worker']), deleteMaterial)

export default router
