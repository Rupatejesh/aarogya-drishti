import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'patient' | 'doctor' | 'hospital_manager' | 'admin';

export interface IUser extends Document {
  email?: string;
  phone?: string;
  aadhar?: string;
  role: UserRole;
  passwordHash?: string;
  activeStatus: boolean;
  uidn?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    aadhar: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'hospital_manager', 'admin'],
      default: 'patient',
      required: true,
      index: true
    },
    passwordHash: {
      type: String,
      select: false
    },
    activeStatus: {
      type: Boolean,
      default: true
    },
    uidn: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;

