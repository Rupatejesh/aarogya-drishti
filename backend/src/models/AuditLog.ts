import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: string;
  role: string;
  action: string;
  targetUidn?: string;
  timestamp: Date;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    targetUidn: {
      type: String,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    ipAddress: {
      type: String
    },
    details: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLogModel;

