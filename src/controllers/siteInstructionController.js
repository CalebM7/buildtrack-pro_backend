import mongoose from 'mongoose';
import SiteInstruction from '../models/SiteInstruction.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// Normalize IDs from params/query before validating
const normalizeObjectId = (id) => String(id ?? '').trim();

// Guard helper for predicatable 400 responses on malformed IDs
const validateObjectId = (id, fieldName = 'id') => {
  const normalizedId = normalizeObjectId(id);
  if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
    return new ApiError(400, `Invalid ${fieldName}: ${normalizedId}`);
  }
  return null;
};

// POST /api/site-instructions
export const createSiteInstruction = catchAsync(async (req, res, next) => {
  // Validate reference IDs early to avoid mongoose cast errors surfacing as 500s
  const invalidProjectId = validateObjectId(req.body.project, 'project id');
  if (invalidProjectId) return next(invalidProjectId);

  if (req.body.recipient) {
    const invalidRecipientId = validateObjectId(
      req.body.recipient,
      'recipient id'
    );
    if (invalidRecipientId) return next(invalidRecipientId);
  }

  if (req.body.issuedBy) {
    const invalidIssuedById = validateObjectId(req.body.issuedBy, 'issuedBy id');
    if (invalidIssuedById) return next(invalidIssuedById);
  }

  const project = await Project.findById(req.body.project).select('_id');
  if (!project) {
    return next(new ApiError(404, `No project found with ID: ${req.body.project}`));
  }

  if (req.body.recipient) {
    const recipient = await User.findById(req.body.recipient).select('_id');
    if (!recipient) {
      return next(
        new ApiError(404, `No recipient user found with ID: ${req.body.recipient}`)
      );
    }
  }

  if (req.body.issuedBy) {
    const issuedBy = await User.findById(req.body.issuedBy).select('_id');
    if (!issuedBy) {
      return next(
        new ApiError(404, `No issuedBy user found with ID: ${req.body.issuedBy}`)
      );
    }
  }

  // Track creator from auth middleware
  req.body.createdBy = req.user.id;

  // If issuer is ommitted, default to logged-in user
  if (!req.body.issuedBy) {
    req.body.issuedBy = req.user.id;
  }

  // Initialize history with first issuance event
  req.body.history = [
    {
      changedBy: req.user.id,
      action: 'Issued',
      note: 'Instruction created',
    },
  ];

  const siteInstruction = await SiteInstruction.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      siteInstruction,
    },
  });
});

// GET /api/site-instructions
export const getAllSiteInstructions = catchAsync(async (req, res, next) => {
  // Basic filter set for MVP list views
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.recipient) filter.recipient = req.query.recipient;

  const siteInstructions = await SiteInstruction.find(filter)
    .populate('project', 'title contractNo')
    .populate('issuedBy recipient createdBy', 'name email role')
    .sort({
      dateIssued: -1,
      createdAt: -1,
    });

  res.status(200).json({
    status: 'success',
    results: siteInstructions.length,
    data: { siteInstructions },
  });
});

// GET /api/site-instructions/:id
export const getSiteInstructionById = catchAsync(async (req, res, next) => {
  const instructionId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(instructionId, 'site instruction id');
  if (invalidIdError) return next(invalidIdError);

  const siteInstruction = await SiteInstruction.findById(instructionId)
    .populate('project', 'title contractNo')
    .populate(
      'issuedBy recipient createdBy history.changedBy',
      'name email role'
    );

  if (!siteInstruction) {
    return next(new ApiError(404, 'No site instruction found with that ID'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      siteInstruction,
    },
  });
});

// PATCH /api/site-instructions/:id
export const updateSiteInstruction = catchAsync(async (req, res, next) => {
  const instructionId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(instructionId, 'site instruction id');
  if (invalidIdError) return next(invalidIdError);

  const siteInstruction = await SiteInstruction.findById(instructionId);
  if (!siteInstruction) {
    return next(new ApiError(404, 'No site instruction found with that ID'));
  }

  // Apply incoming fields
  Object.assign(siteInstruction, req.body);

  // Record status transitions and general edits in history
  siteInstruction.history.push({
    changedBy: req.user.id,
    action: req.body.status
      ? `Status changed to ${req.body.status}`
      : 'Instruction updated',
    note: req.body.closureRemarks || 'No additional note',
  });

  // Auto-stamp completion date when status is completed
  if (req.body.status === 'completed' && !siteInstruction.completedAt) {
    siteInstruction.completedAt = new Date();
  }

  await siteInstruction.save();

  res.status(200).json({
    status: 'success',
    data: {
      siteInstruction,
    },
  });
});

// DELETE /api/site-instructions/:id
export const deleteSiteInstruction = catchAsync(async (req, res, next) => {
  const instructionId = normalizeObjectId(req.params.id);
  const invalidIdError = validateObjectId(instructionId, 'site instruction id');

  if (invalidIdError) return next(invalidIdError);

  const siteInstruction =
    await SiteInstruction.findByIdAndDelete(instructionId);

  if (!siteInstruction) {
    return next(new ApiError(404, 'No site instruction found with that ID'));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
