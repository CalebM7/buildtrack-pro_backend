import mongoose from 'mongoose';

const { Schema } = mongoose;

const weeklyPhotoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    block: {
      type: String,
      trim: true,
    },
    takenAt: {
      type: Date,
    },
  },
  { _id: false }
);

const weeklyWorkforceSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const weeklyVisitorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const weeklyBlockProgressSchema = new Schema(
  {
    block: {
      type: String,
      required: true,
      trim: true,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const weeklyInfoItemSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const weeklyReportSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    photos: [weeklyPhotoSchema],
    weeklySummary: {
      scopeOfWorks: {
        type: String,
        trim: true,
      },
      workforceTotals: [weeklyWorkforceSchema],
      visitors: [weeklyVisitorSchema],
      blockProgressNotes: [weeklyBlockProgressSchema],
      informationRequired: [weeklyInfoItemSchema],
      possibleDelays: [weeklyInfoItemSchema],
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

weeklyReportSchema.index({ project: 1, startDate: 1, endDate: 1 }, { unique: true });

const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);

export default WeeklyReport;
