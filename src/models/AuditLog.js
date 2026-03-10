// src/models/AuditLog.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

// Keep tiny key-value snapshots for quick review in admin timelines.
// For large payloads, keep these fields optional and log only what matters.
const valueSnapshotSchema = new Schema(
  {
    before: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    after: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    changedFields: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const auditLogSchema = new Schema(
  {
    // Tenant/company boundary support for SaaS isolation.
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
      index: true,
    },

    // Actor performing the action; may be null for system jobs.
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Human-readable event category and operation.
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: [
        'create',
        'update',
        'delete',
        'status_change',
        'login',
        'logout',
        'password_change',
        'file_upload',
      ],
      index: true,
    },

    // Resource information lets one log collection serve all modules.
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: [
        'Project',
        'DailyReport',
        'MaterialDelivery',
        'Equipment',
        'SiteInstruction',
        'User',
      ],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity id is required'],
      index: true,
    },

    // Optional short narrative for timeline UI.
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Request context for traceability and incident investigation.
    request: {
      method: { type: String, trim: true },
      route: { type: String, trim: true },
      ip: { type: String, trim: true },
      userAgent: { type: String, trim: true },
      requestId: { type: String, trim: true },
    },

    // Optional diff/snapshot for meaningful updates.
    changes: valueSnapshotSchema,

    // Risk tagging helps operations teams prioritize suspicious actions.
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },

    // Extra flexible metadata for domain-specific details.
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Fast timeline queries: "latest actions for one entity".
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

// Fast user activity lookups.
auditLogSchema.index({ actor: 1, createdAt: -1 });

// Optional retention strategy support via TTL index.
// Example: expire after 365 days. Enable only if policy allows.
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
