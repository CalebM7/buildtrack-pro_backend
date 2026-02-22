import mongoose from 'mongoose';

const { Schema } = mongoose;

// Sub-document for photo attachments
const attachmentSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
  },
  takenAt: {
    type: Date,
  },
});

// Sub-document for normalized location
const locationSchema = new Schema(
  {
    block: {
      type: String,
      required: true,
    },
    floor: {
      type: String,
    },
    area: {
      type: String,
    }, // e.g  'Stairwell', 'Kitchen', 'Living Room'
  },
  { _id: false }
);

// Sub-document for a single activity, scoped to a team
const activitySchema = new Schema({
  location: {
    type: locationSchema,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  photos: [attachmentSchema],
});

// Sub-document for team members
const teamMemberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
    }, // e.g 'Electrician', 'Plumber', 'Carpenter', 'Intern'
  },
  { _id: false }
);

// Sub-document for each team's report within a single day
const teamReportSchema = new Schema({
  name: {
    type: String,
    required: true,
  }, // e.g Group 1 'MUD and Retaining Wall',
  members: [teamMemberSchema],
  activities: [activitySchema],
});

// Sub-document for concerns
const concernSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  location: {
    type: locationSchema,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  photos: [attachmentSchema],
});

// Sub-document for safety hazards
const safetyHazardSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  location: {
    type: locationSchema,
  },
  mitigation: {
    type: String,
  },
  status: {
    type: String,
    enum: ['open', 'mitigated'],
    default: 'open',
  },
  photos: [attachmentSchema],
});

// Sub-document for workforce summary counts
const workforceSummarySchema = new Schema(
  {
    role: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Main DailyReport Schema for a single project on a single day
const dailyReportSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reportNumber: {
      type: String,
      unique: true, // Ensured by pre-save hook
    },
    workflow: {
      status: {
        type: String,
        enum: ['draft', 'submitted', 'approved'],
        default: 'draft',
      },
      submittedAt: { type: Date },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
    },
    // Optional: typically captured in weekly reporting
    weather: {
      morning: String,
      afternoon: String,
      workable: { type: Boolean, default: true },
    },
    teams: [teamReportSchema],
    // Optional: clerk of works usually compiles this for weekly reporting
    workforceSummary: [workforceSummarySchema],
    concerns: [concernSchema],
    safetyHazards: [safetyHazardSchema],
    safetyHazardsNoneFound: {
      type: Boolean,
      default: false,
    },
    safetySummary: {
      type: String
    },
    visitors: [
      {
        name: String,
        company: String,
        purpose: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reports for the same project on the same day
dailyReportSchema.index({
  project: 1,
  date: 1
}, { unique: true });

// Pre-save hook to generate unique report number
dailyReportSchema.pre('save', async function() {
  if (!this.isNew || this.reportNumber) {
    return;
  }

  const project = await mongoose
    .model('Project')
    .findById(this.project)
    .select('contractNo');

  if (!project) {
    throw new Error('Project not found for daily report');
  }

  const dateStr = this.date.toISOString().slice(0, 10).replace(/-/g, '');
  // Count documents for this project to create a sequence number
  const count = await this.constructor.countDocuments({
    project: this.project
  });

  this.reportNumber = `${project.contractNo.split('/')[0]}-${dateStr}-${count + 1}`;
});

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

export default DailyReport;
