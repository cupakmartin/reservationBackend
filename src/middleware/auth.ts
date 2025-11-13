import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

export const checkOwnershipOrAdmin = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = req.user.userId === req.params.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({ 
      error: 'You can only modify your own data' 
    });
    return;
  }

  next();
};
