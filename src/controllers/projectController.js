import mongoose from 'mongoose';
import Project from '../models/Project.js';
import DailyReport from '../models/DailyReport.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';
import { validateObjectId } from './dailyReportController.js';

export const createProject = catchAsync(async (req, res, next) => {
  // Add the logged-in user's ID to the request body
  req.body.createdBy = req.user.id;

  const newProject = await Project.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      project: newProject,
    },
  });
});

export const getAllProjects = catchAsync(async (req, res, next) => {
  // Apply advanced filtering, sorting, field limiting, and pagination
  const features = new APIFeatures(Project.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const projects = await features.query;

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
    },
  });
});

export const getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ApiError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

export const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Returns the modified document rather than the original
    runValidators: true, // Runs schema validators on update
  });

  if (!project) {
    return next(new ApiError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return next(new ApiError('No project found with that ID', 404));
  }

  // 204 No Content is standard for successful deletions
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getProjectHealth = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;
  const invalidProjectIdError = validateObjectId(projectId, 'project id');
  if (invalidProjectIdError) return next(invalidProjectIdError);

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ApiError('No project found with that ID', 404));
  }

  // Run multiple aggregations in parallel for performance
  const [reportStats, concernStats] = await Promise.all([
    // 1. Get total reports and latest update
    DailyReport.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          latestReport: { $max: '$date' },
        },
      },
    ]),
    // 2. Get concern counts by status
    DailyReport.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $unwind: '$concerns' },
      {
        $group: {
          _id: '$concerns.status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      reports: reportStats[0] || { totalReports: 0, latestReport: null },
      concerns: concernStats,
    },
  });
});
