import mongoose from 'mongoose';

// Pull Schema constructor for clearer nested-schema definitions
const { Schema } = mongoose;

// Breakdown record sub-schema:
// One equipment can have many breakdown records over time.
const breakdownSchema = new Schema(
  {
    // When the breakdown was first logged
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    // Human-readable issue description (required for audit trail)
    issue: {
      type: String,
      required: [true, 'Breakdown issue description is required'],
      trim: true,
    },
    // Optional action captured by mechanic/supervisor
    actionTaken: {
      type: String,
      trim: true,
    },
    // Populated once fixed
    resolvedAt: Date,
    // Numeric downtime metric used later for analytics
    downtimeHours: {
      type: Number,
      min: [0, 'Downtime hours must be >= 0'],
      default: 0,
    },
    // Simple lifecycle for each breakdown ticket
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
  },
  // Keep entries lightweight: no separate _id for each breakdown row
  { _id: false }
);

// Main Equipment schema
const equipmentSchema = new Schema(
  {
    // Equipment belongs to one project
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    // Display label e.g "Concrete Mixer", "Excavator"
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    // Project-scoped identifier like EQ-001
    equipmentCode: {
      type: String,
      required: [true, 'Equipment code is required'],
      trim: true,
    },
    // Human-facing register id/plate/chassis tag used in weekly tables
    registrationId: {
      type: String,
      trim: true,
    },
    // Manufacturer/model column from weekly report layout
    model: {
      type: String,
      trim: true,
    },
    // Quantity representation for entries such as "Tower Crane (2)"
    unitCount: {
      type: Number,
      min: [1, 'Unit count must be at least 1'],
      default: 1,
    },
    // Functional grouping for filtering/reporting
    category: {
      type: String,
      enum: [
        'earthmoving',
        'concrete',
        'lifting',
        'transport',
        'electrical',
        'water',
        'other',
      ],
      default: 'other',
    },
    // Current operational state
    status: {
      type: String,
      enum: ['available', 'in_use', 'idle', 'under_maintenance', 'broken_down'],
      default: 'available',
    },
    // Direct mapping to weekly column "Status of Utilization"
    utilizationStatus: {
      type: String,
      enum: ['utilized', 'not_utilized'],
      default: 'utilized',
    },
    // Direct mapping to weekly column "Breakdown Duration"
    breakdownDurationHours: {
      type: Number,
      min: [0, 'Breakdown duration must be >= 0'],
      default: 0,
    },
    // Optional free-text location (block/floor/yard)
    currentLocation: {
      type: String,
      trim: true,
    },
    // Optional user currently assigned as operator
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Needed for cost tracking
    ownershipType: {
      type: String,
      enum: ['owned', 'hired', 'leased'],
      default: 'owned',
    },
    // Vendor/hire company when not owned
    supplierOrHireCompany: {
      type: String,
      trim: true,
    },
    // Daily cost if hired/leased
    hireRatePerDay: {
      type: Number,
      min: [0, 'Hire rate must be >= 0'],
      default: 0,
    },
    // Meter mode supports both stationary and mobile equipment
    meterType: {
      type: String,
      enum: ['hour_meter', 'odometer', 'none'],
      default: 'none',
    },
    // Current meter reading for utilization tracking
    meterReading: {
      type: Number,
      min: [0, 'Meter reading must be >= 0'],
      default: 0,
    },
    // Preventive maintenance fields
    lastServiceDate: Date,
    nextServiceDueDate: Date,
    // Breakdown history lives inside the equipment document
    breakdowns: [breakdownSchema],
    // Optional notes
    remarks: {
      type: String,
      trim: true,
    },
    // Actor who created this equipment record
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Prevent duplicate equipment codes inside the same project
equipmentSchema.index({ project: 1, equipmentCode: 1 }, { unique: true });
// Speed up dashboard queries by status
equipmentSchema.index({ project: 1, status: 1 });
// Speed up weekly utilization summaries
equipmentSchema.index({ project: 1, utilizationStatus: 1 });
// Speed up category-based filters
equipmentSchema.index({ project: 1, category: 1 });

const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;
