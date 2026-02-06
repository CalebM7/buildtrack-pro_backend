import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const createProject = catchAsync(async (req, res, next) => {
  // Add the logged-in user's ID to the request body
  req.body.createdBy = req.user.id;

  const newProject = await Project.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      project: newProject,
    }
  })
});

export const getAllProjects = catchAsync(async (req, res, next) => {
  // Basic find() - we will add advanced filtering, sorting, and pagination later
  const projects = await Project.find();

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



