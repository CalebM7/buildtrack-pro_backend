import DailyReport from '../models/DailyReport.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

const normalizeObjectId = (id) => String(id ?? '').trim();

export const validateObjectId = (id, fieldName = 'id') => {
  const normalizedId = normalizeObjectId(id);
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    return new ApiError(400, `Invalid ${fieldName}: ${normalizedId}`);
  }
  return null;
};

export const createDailyReport = catchAsync(async (req, res, next) => {
  const dailyReport = await DailyReport.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { dailyReport },
  });
});

export const getAllDailyReports = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    DailyReport.find().populate('project', 'title contractNo'),
    req.query
  )
    .filter()
    .sort('-date')
    .limitFields()
    .paginate();

  const dailyReports = await features.query;

  res.status(200).json({
    status: 'success',
    results: dailyReports.length,
    data: { dailyReports },
  });
});

export const getDailyReportById = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(reportId, 'daily report id');
  if (invalidIdError) return next(invalidIdError);

  const dailyReport = await DailyReport.findById(reportId)
    .populate('project', 'title contractNo')
    .populate('workflow.approvedBy', 'name email');

  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  res.status(200).json({
    status: 'success',
    data: { dailyReport },
  });
});

export const updateDailyReport = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(reportId, 'daily report id');
  if (invalidIdError) return next(invalidIdError);

  const dailyReport = await DailyReport.findByIdAndUpdate(reportId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  res.status(200).json({
    status: 'success',
    data: { dailyReport },
  });
});

export const deleteDailyReport = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(reportId, 'daily report id');
  if (invalidIdError) return next(invalidIdError);

  const dailyReport = await DailyReport.findByIdAndDelete(reportId);

  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Nested Concern Management
export const addConcern = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(reportId, 'daily report id');
  if (invalidIdError) return next(invalidIdError);

  const dailyReport = await DailyReport.findById(reportId);
  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  dailyReport.concerns.push(req.body);
  await dailyReport.save();

  res.status(201).json({
    status: 'success',
    data: {
      concerns: dailyReport.concerns,
    },
  });
});

export const updateConcern = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const concernId = normalizeObjectId(req.params.concernId);

  const invalidReportIdError = validateObjectId(reportId, 'daily report id');
  if (invalidReportIdError) return next(invalidReportIdError);

  const invalidConcernIdError = validateObjectId(concernId, 'concern id');
  if (invalidConcernIdError) return next(invalidConcernIdError);

  const dailyReport = await DailyReport.findById(reportId);
  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  const concern = dailyReport.concerns.id(concernId);
  if (!concern) {
    return next(new ApiError(404, 'No concern found with that ID'));
  }

  Object.assign(concern, req.body);
  await dailyReport.save();

  res.status(200).json({
    status: 'success',
    data: { concern },
  });
});

export const deleteConcern = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const concernId = normalizeObjectId(req.params.concernId);

  const invalidReportIdError = validateObjectId(reportId, 'daily report id');
  if (invalidReportIdError) return next(invalidReportIdError);

  const invalidConcernIdError = validateObjectId(concernId, 'concern id');
  if (invalidConcernIdError) return next(invalidConcernIdError);

  const dailyReport = await DailyReport.findById(reportId);
  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  const concern = dailyReport.concerns.id(concernId);
  if (!concern) {
    return next(new ApiError(404, 'No concern found with that ID'));
  }

  concern.deleteOne();
  await dailyReport.save();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const buildPhotoAttachments = (files, caption, takenAt) => {
  // Normalize the uploaded files into the attachment schema.
  return files.map((file) => ({
    url: file.path, // Cloudinary URL generated by storage adapter
    caption: caption || undefined, // Optional caption for all images
    takenAt: takenAt ? new Date(takenAt) : undefined, // Optional timestamp
  }));
};

export const addActivityPhotos = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const teamId = normalizeObjectId(req.params.teamId);
  const activityId = normalizeObjectId(req.params.activityId);

  const invalidReportIdError = validateObjectId(reportId, 'daily report id');
  if (invalidReportIdError) return next(invalidReportIdError);

  const invalidTeamIdError = validateObjectId(teamId, 'team id');
  if (invalidTeamIdError) return next(invalidTeamIdError);

  const invalidActivityIdError = validateObjectId(activityId, 'activity id');
  if (invalidActivityIdError) return next(invalidActivityIdError);

  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'Please upload at least one photo.'));
  }

  const dailyReport = await DailyReport.findById(reportId);
  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  const team = dailyReport.teams.id(teamId);
  if (!team) {
    return next(new ApiError(404, 'No team found with that ID'));
  }

  const activity = team.activities.id(activityId);
  if (!activity) {
    return next(new ApiError(404, 'No activity found with that ID'));
  }

  const attachments = buildPhotoAttachments(req.files, req.body.caption, req.body.takenAt);
  activity.photos.push(...attachments);

  await dailyReport.save();

  res.status(200).json({
    status: 'success',
    data: { photos: activity.photos },
  });
});

export const addConcernPhotos = catchAsync(async (req, res, next) => {
  const reportId = normalizeObjectId(req.params.id);
  const concernId = normalizeObjectId(req.params.concernId);

  const invalidReportIdError = validateObjectId(reportId, 'daily report id');
  if (invalidReportIdError) return next(invalidReportIdError);

  const invalidConcernIdError = validateObjectId(concernId, 'concern id');
  if (invalidConcernIdError) return next(invalidConcernIdError);

  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'Please upload at least one photo.'));
  }

  const dailyReport = await DailyReport.findById(reportId);
  if (!dailyReport) {
    return next(new ApiError(404, 'No daily report found with that ID'));
  }

  const concern = dailyReport.concerns.id(concernId);
  if (!concern) {
    return next(new ApiError(404, 'No concern found with that ID'));
  }

  const attachments = buildPhotoAttachments(req.files, req.body.caption, req.body.takenAt);
  concern.photos.push(...attachments);

  await dailyReport.save();

  res.status(200).json({
    status: 'success',
    data: { photos: concern.photos },
  });
});
