import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Client Schemas
export const createClientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional()
})

export const updateClientSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional()
})

// Material Schema
export const createMaterialSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.enum(['ml', 'g', 'pcs'], { 
        errorMap: () => ({ message: 'Unit must be one of: ml, g, pcs' })
    }),
    stockOnHand: z.number().nonnegative('Stock must be non-negative')
})

export const updateMaterialSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    unit: z.enum(['ml', 'g', 'pcs'], {
        errorMap: () => ({ message: 'Unit must be one of: ml, g, pcs' })
    }).optional(),
    stockOnHand: z.number().nonnegative('Stock must be non-negative').optional()
})

// Procedure Schema
export const createProcedureSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    durationMin: z.number().positive('Duration must be positive'),
    price: z.number().positive('Price must be positive')
})

export const updateProcedureSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    durationMin: z.number().positive('Duration must be positive').optional(),
    price: z.number().positive('Price must be positive').optional()
})

// BOM Schema
export const bomSchema = z.array(
    z.object({
        materialId: z.string().min(1, 'Material ID is required'),
        qtyPerProcedure: z.number().positive('Quantity must be positive')
    })
)

// Booking Schema
export const createBookingSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    providerName: z.string().min(1, 'Provider name is required'),
    procedureId: z.string().min(1, 'Procedure ID is required'),
    startsAt: z.string().datetime().or(z.date()),
    endsAt: z.string().datetime().or(z.date()),
    status: z.enum(['held', 'confirmed', 'fulfilled', 'cancelled'], {
        errorMap: () => ({ message: 'Status must be one of: held, confirmed, fulfilled, cancelled' })
    }),
    paymentType: z.enum(['cash', 'card', 'deposit'], {
        errorMap: () => ({ message: 'Payment type must be one of: cash, card, deposit' })
    })
})

export const updateBookingSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required').optional(),
    providerName: z.string().min(1, 'Provider name is required').optional(),
    procedureId: z.string().min(1, 'Procedure ID is required').optional(),
    startsAt: z.string().datetime().or(z.date()).optional(),
    endsAt: z.string().datetime().or(z.date()).optional(),
    status: z.enum(['held', 'confirmed', 'fulfilled', 'cancelled'], {
        errorMap: () => ({ message: 'Status must be one of: held, confirmed, fulfilled, cancelled' })
    }).optional(),
    paymentType: z.enum(['cash', 'card', 'deposit'], {
        errorMap: () => ({ message: 'Payment type must be one of: cash, card, deposit' })
    }).optional()
})

// Validation Middleware Factory
export const validate = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body)
            next()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors 
                })
            }
            next(error)
        }
    }
}
