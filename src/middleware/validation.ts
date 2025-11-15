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

export const updateLoyaltySchema = z.object({
    loyaltyTier: z.enum(['Bronze', 'Silver', 'Gold', 'Worker', ''], {
        errorMap: () => ({ message: 'Loyalty tier must be one of: Bronze, Silver, Gold, Worker, or empty' })
    })
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
    description: z.string().optional(),
    durationMin: z.number().positive('Duration must be positive'),
    price: z.number().positive('Price must be positive')
})

export const updateProcedureSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
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
    workerId: z.string().min(1, 'Worker ID is required'),
    procedureId: z.string().min(1, 'Procedure ID is required'),
    startsAt: z.string().datetime().or(z.date()),
    endsAt: z.string().datetime().or(z.date()),
    status: z.enum(['held', 'confirmed', 'fulfilled', 'cancelled'], {
        errorMap: () => ({ message: 'Status must be one of: held, confirmed, fulfilled, cancelled' })
    }),
    paymentType: z.enum(['cash', 'card', 'deposit'], {
        errorMap: () => ({ message: 'Payment type must be one of: cash, card, deposit' })
    })
}).refine((data) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    // Check Weekday (Mon-Fri)
    const day = startsAt.getDay(); // Sunday is 0, Saturday is 6
    if (day === 0 || day === 6) {
        return false; // Fails on Sunday or Saturday
    }

    // Check Start Hour (must be 8:00 AM or later and before 20:00)
    const startHour = startsAt.getHours();
    if (startHour < 8 || startHour >= 20) {
        return false; // Fails if before 8:00 AM or at/after 20:00
    }

    // Check End Hour (must be 8:00 PM or earlier)
    // A booking *ending* at 20:00:00 is valid. A booking ending at 20:00:01 is not.
    const endHour = endsAt.getHours();
    const endMinutes = endsAt.getMinutes();
    if (endHour > 20 || (endHour === 20 && endMinutes > 0)) {
        return false; // Fails if after 20:00
    }
    
    // Check that end time is after start time
    if (endsAt <= startsAt) {
        return false;
    }

    return true;
}, {
    message: "Bookings must be within 8:00 - 20:00, Monday to Friday.",
})

export const updateBookingSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required').optional(),
    workerId: z.string().min(1, 'Worker ID is required').optional(),
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
