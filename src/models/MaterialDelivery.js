// Import mongoose to define the schema and the model
import mongoose from 'mongoose';

// Pull Schema constructor for cleaner code
const { Schema } = mongoose;

// Sub-schema for each line in a single delivery note
const deliveryItemSchema = new Schema(
  {
    // Material name. e.g Cement, Sand, Ballast
    material: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    // Optional specification to capture grade/type
    specification: {
      type: String,
      trim: true,
    }, // e.g. "Cement 42.5N", "Ballast 20mm"
    // Unit of measurement for the quantity
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    }, // e.g bags, m3, tonnes
    // Quantity that arrived on site
    quantityDelivered: {
      type: Number,
      required: [true, 'Delivered quantity is required'],
      min: [0, 'Delivered quanity must be >= 0'],
    },
    // Quantity accepted after quality/physical checks
    quantityAccepted: {
      type: Number,
      min: [0, 'Accepted quantity must be >= 0'],
      default: 0,
    },
  },
  // No separate _id for each item row (keeps payload lighter)
  { _id: false }
);

// Sub-schema for optional photos/docs (delivery note photo, damaged bags, etc)
const attachmentSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, 'Attachment URL is required'],
    },
    caption: String,
  },
  // Keep this lightweight too
  { _id: false }
);

// Main schema: one document = one material delivery event
const materialDeliverySchema = new Schema(
  {
    // Link delivery to a project
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    // Delivery Date
    date: {
      type: Date,
      required: [true, 'Delivery date is required'],
    },
    // Supplier delivery note number
    deliveryNoteNo: {
      type: String,
      trim: true,
      required: [true, 'Delivery note number is required'],
    },
    // Supplier/vendor name
    supplier: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    // User who physically received material
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiving officer is required'],
    },
    // Optional QA/QS/engineer checker
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Array of delivered items; must not be empty
    items: {
      type: [deliveryItemSchema],
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: 'At least one delivery item is required',
      },
    },
    // Overall acceptance outcome
    qualityStatus: {
      type: String,
      enum: ['accepted', 'partially_accepted', 'rejected'],
      default: 'accepted',
    },
    // Why material was partially accepted/rejected
    rejectedReason: {
      type: String,
      trim: true,
    },
    // Free-form operational remarks
    remarks: {
      type: String,
      trim: true,
    },
    // Optional supporting photos/files
    attachments: [attachmentSchema],
    // User creating this record in system
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    // Auto add createdAt and updateAt
    timestamps: true,
  }
);

// Prevent duplicate more numbers within same project
materialDeliverySchema.index({
  project: 1,
  deliveryNoteNo: 1
},
{ unique: true });
// Speed up project timeline queries
materialDeliverySchema.index({
  project: 1,
  date: -1
});
// Speed up quality-status based reporting
materialDeliverySchema.index({
  qualityStatus: 1,
  date: -1
});

// Create model
const MaterialDelivery = mongoose.model('MaterialDelivery', materialDeliverySchema);

// Export model for controller usage
export default MaterialDelivery;
