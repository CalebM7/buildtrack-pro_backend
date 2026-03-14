import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blockId: {
    type: String,
    required: true,
  }, // e.g 'A1', 'B2', 'A3', 'B4', 'MUD'
  name: String, // e.g 'Block A1'
  type: String, // e.g social, affordable, market
  totalFloors: Number,
  currentProgress: {
    type: Number,
    default: 0,
  }, // Overall Percentage
  progressBreakdown: [
    {
      activity: { type: String, required: true }, // e.g 'Substructure', 'Superstructure', 'Finishes'
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    }
  ]
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A project must have a title'],
      trim: true,
    },
    contractNo: {
      type: String,
      required: [true, 'A project must have a contract number'],
      unique: true,
      trim: true,
    },
    county: {
      type: String,
      required: [true, 'A project must have a county'],
    },
    financier: String,
    employer: {
      name: {
        type: String,
        default: 'State Department for Housing and Urban Development',
      },
      address: {
        type: String,
        default: 'P.O. Box 30119-00100, NAIROBI',
      },
    },
    contractor: {
      type: String,
      required: [true, 'Please specify the contractor.'],
    },
    contractPeriod: {
      // In months
      type: Number,
      required: [true, 'Please specify the contract period in months.'],
    },
    commencementDate: {
      type: Date,
      required: [true, 'A project must have a commencement date'],
    },
    endingDate: {
      type: Date,
      required: [true, 'A project must have an ending date'],
    },
    scopeOfWorks: {
      type: String,
      trim: true,
    },
    blocks: [blockSchema],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    ipcProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed'],
      default: 'planning',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes for faster queries
projectSchema.index({
  contractNo: 1,
  status: 1,
});

// Virtuals
projectSchema.virtual('daysElapsed').get(function () {
  if (!this.commencementDate) return null;
  const diff = new Date() - this.commencementDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('timeElapsedPercentage').get(function () {
  if (!this.commencementDate || !this.endingDate) return null;
  const totalDuration = this.endingDate - this.commencementDate;
  const elapsedDuration = new Date() - this.commencementDate;
  if (totalDuration <= 0) return 100;
  const percentage = (elapsedDuration / totalDuration) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
