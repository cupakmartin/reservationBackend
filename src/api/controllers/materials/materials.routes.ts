import { Router } from 'express'
import { validate, createMaterialSchema } from '../../../middleware/validation'
import { getAllMaterials, createMaterial } from './materials.controller'

const router = Router()

router.get('/', getAllMaterials)
router.post('/', validate(createMaterialSchema), createMaterial)

export default router
