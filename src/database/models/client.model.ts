import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'client' | 'worker' | 'admin';
  refreshToken?: string;
  visitsCount: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Worker' | null;
  manualLoyaltyTier: boolean;
  avatarUrl?: string;
  createdAt: Date;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true, sparse: true },
  phone: { type: String, required: false },
  password: { type: String, required: false, select: false },
  role: { 
    type: String, 
    enum: ['client', 'worker', 'admin'], 
    default: 'client' 
  },
  refreshToken: { type: String, select: false },
  visitsCount: { type: Number, default: 0 },
  avatarUrl: { type: String, required: false },
  loyaltyTier: { 
    type: String, 
    enum: ['Bronze', 'Silver', 'Gold', 'Worker', null], 
    default: null 
  },
  manualLoyaltyTier: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Client = mongoose.model<IClient>('Client', ClientSchema);
