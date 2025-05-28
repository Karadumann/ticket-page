import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin' | 'staff' | 'moderator';
  avatar?: string;
  notificationPreferences?: {
    email: boolean;
    discord: boolean;
    discordMuted?: boolean;
    discordMuteUntil?: Date | null;
  };
  discordId?: string;
  discordUsername?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin', 'staff', 'moderator'], default: 'user' },
  avatar: { type: String },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    discord: { type: Boolean, default: false },
    discordMuted: { type: Boolean, default: false },
    discordMuteUntil: { type: Date, default: null },
  },
  discordId: { type: String, default: null },
  discordUsername: { type: String, default: null },
}, { timestamps: true });

UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema); 