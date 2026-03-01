// For ObjectId validation utility
import mongoose from 'mongoose';
// MaterialDelivery model for DB operations
import MaterialDelivery from '../models/MaterialDelivery.js';
// Custom operational errors with status codes
import ApiError from '../utils/ApiError.js';
// Async wrapper to forward thrown errors to global error handler
import catchAsync from '../utils/catchAsync.js';

// Normalize incoming IDs (trim spaces, coerce null/undefined safely)
const normalizedObjectId = (id) => String(id ?? '').trim();

// Reusable ID validator to avoid repeated casting errors
const validateObjectId = (id, fieldName = 'id') => {
  const normalizedId = normalizedObjectId(id);
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    return new ApiError(400, `Invalid ${fieldName}: ${normalizedId}`);
  }
  return null;
};

// CREATE /api.material-deliveries
export const createMaterialDelivery = catchAsync(async (req, res, next) => {
  // Track who created the entry
  req.body.createdBy = req.user.id;

  // Insert into DB
  const materialDelivery = await MaterialDelivery.create(req.body);

  // Return created payload
  res.status(201).json({
    status: 'success',
    data: { materialDelivery },
  });
});

// Get /api/material-deliveries
export const getAllMaterialDeliveries = catchAsync(async (req, res, next) => {
  // Build dynamic filter from query params
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.date) filter.date = req.query.date;
  if (req.query.qualityStatus) filter.qualityStatus = req.query.qualityStatus;

  // Query + populate refs for readable API responses
  const materialDeliveries = await MaterialDelivery.find(filter)
    .populate('project', 'title contractNo')
    .populate('receivedBy checkedBy createdBy', 'name email role')
    .sort({ date: -1, createdAt: -1 });

  // Return list
  res.status(200).json({
    status: 'success',
    results: materialDeliveries.length,
    data: { materialDeliveries },
  });
});

// Get /api/material-deliveries/:id
export const getMaterialDeliveryById = catchAsync(async (req, res, next) => {
  // Validate route param first
  const deliveryId = normalizedObjectId(req.params.id);
  const invalidIdError = validateObjectId(deliveryId, 'Material Delivery ID');
  if (invalidIdError) return next(invalidIdError);

  // Fetch one record and populate refrences
  const materialDelivery = await MaterialDelivery.findById(deliveryId)
    .populate('project', 'title contractNo')
    .populate('receivedBy checkedBy createdBy', 'name email role');

  // 404 if no record
  if (!materialDelivery) {
    return next(new ApiError(404, 'No Material Delivery found with that ID'));
  }
  // Return single record
  res.status(200).json({
    status: 'success',
    data: { materialDelivery },
  });
});

// PATCH /api/material-deluveries/:id
export const updateMaterialDelivery = catchAsync(async (req, res, next) => {
  // Validate route param first
  const deliveryId = normalizedObjectId(req.params.id);
  const invalidIdError = validateObjectId(deliveryId, 'material delivery id');
  if (invalidIdError) return next(invalidIdError);

  // Update record and return new version with Schema validators enforced
  const materialDelivery = await MaterialDelivery.findByIdAndUpdate(
    deliveryId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  // 404 if not found
  if (!materialDelivery) {
    return next(new ApiError(404, 'No material deluvery found with that ID'));
  }

  // Return updated record
  res.status(200).json({
    status: 'success',
    data: { materialDelivery },
  });
});

// DELETE /api/material-deliverys/:id
export const deleteMaterialDelivery = catchAsync(async (req, res, next) => {
  // Validate route param first
  const deliveryId = normalizedObjectId(req.params.id);
  const invalidIdError = validateObjectId(deliveryId, 'material delivery id');
  if (invalidIdError) return next(invalidIdError);

  // Delete record
  const materialDelivery = await MaterialDelivery.findByIdAndDelete(deliveryId);

  // 404 if not found
  if (!materialDelivery) {
    return next(new ApiError(404, 'No material delivery found with that ID'));
  }

  // 204 = deleted, no response body content expected
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
