import { Request, Response, NextFunction } from 'express';
import { authService } from '../../../services/auth.service';

export const register = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    const { user, tokens } = await authService.register({
      name,
      email,
      phone,
      password,
      role
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const login = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const { user, tokens } = await authService.login({ email, password });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const refresh = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    // Handle JWT errors and invalid refresh tokens
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};
