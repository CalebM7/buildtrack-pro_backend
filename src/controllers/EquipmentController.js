import mongoose from 'mongoose';
import Equipment from '../models/Equipment.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// Normalize IDs to avoid hidden validation issues from whitespace/null values
const normalizeObjectId = (id) => String(id ?? '').trim();

// Reusable Object guard before touching MOngo queries
const validateObjectId = (id, fieldName = 'id') => {
  const normalizedId = normalizeObjectId(id);
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    return new ApiError(400, `Invalid ${fieldName}: ${normalizedId}`);
  }
  return null;
};

// POST /api/equipment
export const createEquipment = catchAsync(async (req, res, next) => {
  // Record actor from authenticated user
  req.body.createdBy = req.user.id;

  const equipment = await Equipment.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { equipment },
  });
});

// GET /api/equipment
export const getAllEquipment = catchAsync(async (req, res, next) => {
  // Lightweight filter strategy for MVP
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.utilizationStatus) filter.utilizationStatus = req.query.utilizationStatus;
  if (req.query.ownershipType) filter.ownershipType = req.query.ownershipType;

  const equipmentList = await Equipment.find(filter)
    .populate('project', 'title contractNo')
    .populate('operator createdBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: equipmentList.length,
    data: { equipment: equipmentList },
  });
});



// GET /api/equipment/:id
export const getEquipmentById = catchAsync(async (req, res, next) => {
  const equipmentId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(equipmentId, 'equipment id'
  );
  if (invalidIdError) return next(invalidIdError);

  const equipment = await Equipment.findById(equipmentId)
    .populate('project', 'title contractNo')
    .populate('operator createdBy', 'name email role');

  if (!equipment) {
    return next(new ApiError(404, 'No equipment found with that ID'));
  }

  res.status(200).json({
    status: 'success',
    data: { equipment },
  });
});

// PATCH /api/equipment/:id
export const updateEquipment = catchAsync(async (req, res, next) => {
  const equipmentId = normalizeObjectId(req.params.id);
  const invalidError = validateObjectId(equipmentId, 'equipment id');
  if (invalidError) return next(invalidError);

  const equipment = await Equipment.findByIdAndUpdate(equipmentId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!equipment) {
    return next(new ApiError(404, 'No equipment found with that ID'));
  }

  res.status(200).json({
    status: 'success',
    data: { equipment },
  });
});

// DELETE /api/equipment/:id
export const deleteEquipment = catchAsync(async (req, res, next) => {
  const equipmentId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(equipmentId, 'equipment id');
  if (invalidIdError) return next(invalidIdError);

  const equipment = await Equipment.findByIdAndDelete(equipmentId);

  if (!equipment) {
    return next (new ApiError(404, 'No equipment found with that ID'));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
