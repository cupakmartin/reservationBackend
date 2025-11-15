import { Router } from 'express'
import { validate, createProcedureSchema, updateProcedureSchema, bomSchema } from '../../../middleware/validation'
import { authenticate, checkRole } from '../../../middleware/auth'
import { 
    getAllProcedures, 
    getProcedureById,
    createProcedure, 
    updateProcedure,
    deleteProcedure,
    updateProcedureBOM 
} from './procedures.controller'

const router = Router()

// All authenticated users can view procedures
router.get('/', authenticate, getAllProcedures)
router.get('/:id', authenticate, getProcedureById)

// Workers and admins can create, update, or delete procedures
router.post('/', authenticate, checkRole(['admin', 'worker']), validate(createProcedureSchema), createProcedure)
router.put('/:id', authenticate, checkRole(['admin', 'worker']), validate(updateProcedureSchema), updateProcedure)
router.delete('/:id', authenticate, checkRole(['admin', 'worker']), deleteProcedure)
router.post('/:id/bom', authenticate, checkRole(['admin', 'worker']), validate(bomSchema), updateProcedureBOM)

export default router
