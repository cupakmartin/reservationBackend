import { Router } from 'express'
import { validate, createMaterialSchema, updateMaterialSchema } from '../../../middleware/validation'
import { 
    getAllMaterials, 
    getMaterialById,
    createMaterial, 
    updateMaterial,
    deleteMaterial 
} from './materials.controller'

const router = Router()

router.get('/', getAllMaterials)
router.get('/:id', getMaterialById)
router.post('/', validate(createMaterialSchema), createMaterial)
router.put('/:id', validate(updateMaterialSchema), updateMaterial)
router.delete('/:id', deleteMaterial)

export default router
