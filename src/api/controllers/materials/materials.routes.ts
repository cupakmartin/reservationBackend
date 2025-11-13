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

// Only admins can create, update, or delete materials
router.post('/', authenticate, checkRole(['admin']), validate(createMaterialSchema), createMaterial)
router.put('/:id', authenticate, checkRole(['admin']), validate(updateMaterialSchema), updateMaterial)
router.delete('/:id', authenticate, checkRole(['admin']), deleteMaterial)

export default router
