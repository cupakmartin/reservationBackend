// src/api/controllers/admin/email.controller.ts
import { Request, Response } from 'express';

const MAILING_SERVICE_URL = process.env.MAILING_SERVICE_URL || 'http://localhost:4001';

/**
 * Get all email templates from mailing service
 */
export async function getEmailTemplates(req: Request, res: Response): Promise<void> {
    try {
        const response = await fetch(`${MAILING_SERVICE_URL}/templates`);
        
        if (!response.ok) {
            const error = await response.json();
            res.status(response.status).json(error);
            return;
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[email-controller] Failed to fetch templates:', error);
        res.status(500).json({ 
            error: 'Failed to fetch email templates',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(req: Request, res: Response): Promise<void> {
    const { trigger } = req.params;
    const { subject, htmlTemplate, enabled, roles } = req.body;
    
    // Validate input
    if (!subject || subject.trim().length === 0) {
        res.status(400).json({ error: 'Subject cannot be empty' });
        return;
    }
    
    if (!htmlTemplate || htmlTemplate.trim().length === 0) {
        res.status(400).json({ error: 'HTML template cannot be empty' });
        return;
    }
    
    if (!Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({ error: 'At least one role must be selected' });
        return;
    }
    
    const validRoles = ['client', 'worker', 'admin'];
    if (roles.some((r: string) => !validRoles.includes(r))) {
        res.status(400).json({ 
            error: 'Invalid role',
            allowed: validRoles
        });
        return;
    }
    
    try {
        const response = await fetch(`${MAILING_SERVICE_URL}/templates/${trigger}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject, htmlTemplate, enabled, roles })
        });
        
        if (!response.ok) {
            const error = await response.json();
            res.status(response.status).json(error);
            return;
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[email-controller] Failed to update template:', error);
        res.status(500).json({ 
            error: 'Failed to update email template',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
