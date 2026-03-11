import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMailLog extends Document {
  companyId?: mongoose.Types.ObjectId;
  recipientEmail: string;
  subject: string;
  service?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MailLogSchema: Schema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    service: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const MailLog: Model<IMailLog> = mongoose.models.MailLog || mongoose.model<IMailLog>('MailLog', MailLogSchema);

export default MailLog;

