import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
  timestamp: Date;
}

const LogSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ILog>('Log', LogSchema); 