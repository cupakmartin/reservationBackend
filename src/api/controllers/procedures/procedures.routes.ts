import { Router } from 'express'
import { validate, createProcedureSchema, bomSchema } from '../../../middleware/validation'
import { getAllProcedures, createProcedure, updateProcedureBOM } from './procedures.controller'

const router = Router()

router.get('/', getAllProcedures)
router.post('/', validate(createProcedureSchema), createProcedure)
router.post('/:id/bom', validate(bomSchema), updateProcedureBOM)

export default router
