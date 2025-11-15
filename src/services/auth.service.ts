import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client, IClient } from '../database/models/client.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface RegisterDTO {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'client' | 'worker' | 'admin';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async register(data: RegisterDTO): Promise<{ user: IClient; tokens: AuthTokens }> {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await Client.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const clientData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role || 'client'
    };
    
    // Set Worker tier for worker accounts
    if (clientData.role === 'worker') {
      clientData.loyaltyTier = 'Worker';
    }
    
    const user = await Client.create(clientData);

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(data: LoginDTO): Promise<{ user: IClient; tokens: AuthTokens }> {
    const user = await Client.findOne({ email: data.email }).select('+password');
    
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
    
    const user = await Client.findById(payload.userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  async getUserById(userId: string): Promise<IClient | null> {
    return await Client.findById(userId).select('+password');
  }

  private generateTokens(user: IClient): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await Client.findByIdAndUpdate(userId, { refreshToken });
  }
}

export const authService = new AuthService();
