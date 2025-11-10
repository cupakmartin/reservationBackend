import { Router } from 'express'
import { validate, createClientSchema, updateClientSchema } from '../../../middleware/validation'
import { getAllClients, createClient, updateClient, deleteClient } from './clients.controller'

const router = Router()

router.get('/', getAllClients)
router.post('/', validate(createClientSchema), createClient)
router.put('/:id', validate(updateClientSchema), updateClient)
router.delete('/:id', deleteClient)

export default router
