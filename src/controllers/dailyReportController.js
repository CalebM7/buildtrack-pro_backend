import DailyReport from '../models/DailyReport.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import mongoose from 'mongoose';

const normalizeObjectId = (id) => String(id ?? '').trim();

const validateObjectId = (id, fieldName = 'id') => {
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
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.date) filter.date = req.query.date;

  const dailyReports = await DailyReport.find(filter)
    .populate('project', 'title contractNo')
    .sort({ date: -1 });

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

  const dailyReport = await DailyReport.findByIdAndUpdate(
    reportId,
    req.body,
    { new: true, runValidators: true }
  );

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
