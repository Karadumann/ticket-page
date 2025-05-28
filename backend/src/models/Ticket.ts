import mongoose, { Document, Schema } from 'mongoose';

export interface IReply {
  message: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ISatisfactionSurvey {
  rating: number;
  comment: string;
  submittedAt: Date;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  user: mongoose.Types.ObjectId;
  replies: IReply[];
  nickname: string;
  screenshotUrls?: string[];
  category: 'bug' | 'payment' | 'account' | 'suggestion' | 'report_player' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'very_high';
  assignedTo?: mongoose.Types.ObjectId;
  satisfactionSurvey?: ISatisfactionSurvey;
  labels?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ReplySchema = new Schema<IReply>({
  message: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const SatisfactionSurveySchema = new Schema<ISatisfactionSurvey>({
  rating: { type: Number, required: true },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const TicketSchema = new Schema<ITicket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [ReplySchema],
  nickname: { type: String, required: true },
  screenshotUrls: [{ type: String }],
  category: { type: String, enum: ['bug', 'payment', 'account', 'suggestion', 'report_player', 'technical', 'other'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'very_high'], required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  satisfactionSurvey: { type: SatisfactionSurveySchema, default: null },
  labels: [{ type: String, default: [] }],
}, { timestamps: true });

TicketSchema.index({ user: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ createdAt: -1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema); 