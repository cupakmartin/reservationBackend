import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'client' | 'worker' | 'admin';
  refreshToken?: string;
  loyaltyPoints: number;
  visitsCount?: number;
  loyaltyTier?: string;
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
  loyaltyPoints: { type: Number, default: 0 },
  visitsCount: { type: Number, default: 0 },
  loyaltyTier: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

export const Client = mongoose.model<IClient>('Client', ClientSchema);
