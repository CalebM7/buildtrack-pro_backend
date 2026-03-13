import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

// 1. GET ALL USERS (Admin Only)
export const getAllUsers = catchAsync(async (req, res, next) => {
  const baseQuery = User.find({
    isActive: {
      $ne: false,
    },
  }).select(
    '-password -passwordChangedAt -passwordResetToken -passwordResetExpires'
  );

  const features = new APIFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

// 2. GET SINGLE USER
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    '-password -passwordChangedAt -passwordResetToken -passwordResetExpires'
  );

  if (!user) {
    return next(new ApiError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// 3. UPDATE USER PROFILE (Admin Only)
export const updateUser = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'avator');

  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select(
    '-password -passwordChangedAt -passwordResetToken -passwordResetExpires'
  );

  if (!user) {
    return next(new ApiError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// 4. UPDATE USER ROLE (Super Admin Only)
export const updateUserRole = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      role: req.body.role,
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new ApiError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// 5. DEACTIVATE USER (Soft Delete)
export const deleteUser = catchAsync(async (req, res, next) => {
  // We don't actaully delete the user, we just mark them as inactive
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false });

  if (!user) {
    return next(new ApiError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
