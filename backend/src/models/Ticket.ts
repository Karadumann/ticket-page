import mongoose, { Document, Schema } from 'mongoose';

export interface IReply {
  message: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  status: 'open' | 'closed' | 'pending';
  user: mongoose.Types.ObjectId;
  replies: IReply[];
}

const ReplySchema = new Schema<IReply>({
  message: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'pending'], default: 'open' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [ReplySchema],
}, { timestamps: true });

export default mongoose.model<ITicket>('Ticket', TicketSchema); 