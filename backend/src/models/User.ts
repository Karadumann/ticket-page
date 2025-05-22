import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin' | 'staff' | 'moderator';
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin', 'staff', 'moderator'], default: 'user' },
}, { timestamps: true });

UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema); 