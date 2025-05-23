import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminChatMessage extends Document {
  userId: string;
  username: string;
  role: string;
  message: string;
  timestamp: number;
}

const AdminChatMessageSchema = new Schema<IAdminChatMessage>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

export default mongoose.model<IAdminChatMessage>('AdminChatMessage', AdminChatMessageSchema); 