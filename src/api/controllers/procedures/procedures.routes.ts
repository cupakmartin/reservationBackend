import { Router } from 'express'
import { validate, createProcedureSchema, updateProcedureSchema, bomSchema } from '../../../middleware/validation'
import { 
    getAllProcedures, 
    getProcedureById,
    createProcedure, 
    updateProcedure,
    deleteProcedure,
    updateProcedureBOM 
} from './procedures.controller'

const router = Router()

router.get('/', getAllProcedures)
router.get('/:id', getProcedureById)
router.post('/', validate(createProcedureSchema), createProcedure)
router.put('/:id', validate(updateProcedureSchema), updateProcedure)
router.delete('/:id', deleteProcedure)
router.post('/:id/bom', validate(bomSchema), updateProcedureBOM)

export default router
