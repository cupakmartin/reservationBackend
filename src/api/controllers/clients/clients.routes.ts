import { Router } from 'express'
import { validate, createClientSchema, updateClientSchema } from '../../../middleware/validation'
import { authenticate, checkRole, checkOwnershipOrAdmin } from '../../../middleware/auth'
import { 
    getAllClients, 
    getClientById,
    createClient, 
    updateClient, 
    deleteClient 
} from './clients.controller'

const router = Router()

// Public route for client registration (handled by auth controller)
// Admin and worker can view all clients
router.get('/', authenticate, checkRole(['admin', 'worker']), getAllClients)

// Users can view their own profile, admin/worker can view any
router.get('/:id', authenticate, getClientById)

// Create is now handled by auth/register endpoint
router.post('/', validate(createClientSchema), createClient)

// Users can update their own profile, admin can update any
router.put('/:id', authenticate, checkOwnershipOrAdmin, validate(updateClientSchema), updateClient)

// Only admin can delete clients
router.delete('/:id', authenticate, checkRole(['admin']), deleteClient)

export default router
