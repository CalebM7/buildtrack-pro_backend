import mongoose from 'mongoose';

// Shorthand for cleaner nested schema definitions
const { Schema } = mongoose;

// Optional activity log to preseve lifecycle visibility per instruction
const instructionHistorySchema = new Schema(
  {
    // Actor who made this history update
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Human-readable action summary: "Issued", "Acknowleged", "Closed"
    action: {
      type: String,
      required: [true, 'History action is required'],
      trim: true,
    },
    // Optional elaboration for decisions and context
    note: {
      type: String,
      trim: true,
    },
    // Event timestamp
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Main Site instruction schema
const siteInstructionSchema = new Schema(
  {
    // Instruction belongs to one project
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    // Project-scoped serial e.g SI-001, SI-002
    instructionNo: {
      type: String,
      required: [true, 'Instruction number is required'],
      trim: true,
      uppercase: true,
    },
    // Data instruction was formally issued
    dateIssued: {
      type: Date,
      required: [true, 'Date issued is required'],
    },
    // Origiator of the instruction
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issued by user is required'],
    },
    // Primary recipient/assignee of the instruction
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
    },
    // Optional site location: block/floor/zone
    location: {
      type: String,
      trim: true,
    },
    // Short headline for list/table views
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    // Full directive body
    instruction: {
      type: String,
      required: [true, 'Instruction details are required'],
      trim: true,
    },
    // Priority helps supervisors triage workloads
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    // Workflow state from creation to closure
    status: {
      type: String,
      enum: ['issued', 'acknowledged', 'in_progress', 'completed', 'cancelled'],
      default: 'issued',
    },
    // Optional completion target date
    dueDate: Date,
    // Optional completion date ( set when closed)
    completedAt: Date,
    // Optional closure evidence/remarks
    closureRemarks: {
      type: String,
      trim: true,
    },
    // Optional file links (photos, signed forms,  sketches)
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    // Lifecycle history snapshots
    history: [instructionHistorySchema],
    // Actor that initially created this record
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Enforce unique instruction numbering per project
siteInstructionSchema.index(
  {
    project: 1,
    instructionNo: 1,
  },
  {
    unique: true,
  }
);
// Speed up status dashboard and filtering
siteInstructionSchema.index({
  project: 1,
  status: 1,
});
// Speed up schedule-risk queries (overdue/open views)
siteInstructionSchema.index({
  project: 1,
  dueDate: 1,
});

const SiteInstruction = mongoose.model(
  'SiteInstruction',
  siteInstructionSchema
);
export default SiteInstruction;
