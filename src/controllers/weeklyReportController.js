import Project from '../models/Project.js'; // Project model for lookup
import DailyReport from '../models/DailyReport.js'; // Daily reports for the range
import Equipment from '../models/Equipment.js';
import MaterialDelivery from '../models/MaterialDelivery.js';
import SiteInstruction from '../models/SiteInstruction.js';
import WeeklyReport from '../models/WeeklyReport.js';
import ApiError from '../utils/ApiError.js'; // Consistent error handling
import catchAsync from '../utils/catchAsync.js'; // Async error wrapper
import { buildWeeklyReportPdf } from '../services/pdfService.js'; // PDF builder

export const generateWeeklyReport = catchAsync(async (req, res, next) => {
  const { projectId, startDate, endDate } = req.query; // Expect query params

  if (!projectId || !startDate || !endDate) {
    return next(new ApiError(400, 'projectId, startDate, and endDate are required'));
  }

  const project = await Project.findById(projectId); // Ensure project exists
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const start = new Date(startDate); // Parse start date
  const end = new Date(endDate); // Parse end date

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return next(new ApiError(400, 'Invalid date range'));
  }

  // Fetch daily reports
  const dailyReports = await DailyReport.find({
    project: projectId, // Match project
    date: { $gte: start, $lte: end }, // Filter within range
  }).sort({ date: 1 }); // Chronological order

  // Fetch material deliveries
  const materialDeliveries = await MaterialDelivery.find({
    project: projectId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  // Fetch equipment on site (currently assigned to project)
  const equipment = await Equipment.find({
    project: projectId,
  }).populate('operator', 'name');

  // Fetch site instructions issued during the period
  const siteInstructions = await SiteInstruction.find({
    project: projectId,
    dateIssued: { $gte: start, $lte: end },
  }).populate('issuedBy recipient', 'name');

  const weeklyReport = await WeeklyReport.findOne({
    project: projectId,
    startDate: start,
    endDate: end,
  });

  const pdfBuffer = await buildWeeklyReportPdf({
    project,
    dailyReports,
    materialDeliveries,
    equipment,
    siteInstructions,
    weeklyReport,
    startDate: start,
    endDate: end,
  });

  res.setHeader('Content-Type', 'application/pdf'); // Tell browser to expect PDF
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=weekly-report-${project.contractNo}.pdf`
  ); // Force download with readable filename

  res.status(200).send(pdfBuffer); // Stream PDF buffer to client
});

export const upsertWeeklyReport = catchAsync(async (req, res, next) => {
  const { project, startDate, endDate } = req.body;

  if (!project || !startDate || !endDate) {
    return next(new ApiError(400, 'project, startDate, and endDate are required'));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return next(new ApiError(400, 'Invalid date range'));
  }

  const payload = {
    ...req.body,
    startDate: start,
    endDate: end,
  };

  const weeklyReport = await WeeklyReport.findOneAndUpdate(
    { project, startDate: start, endDate: end },
    payload,
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: { weeklyReport },
  });
});

const buildWeeklyPhotoAttachments = (files, caption, block, takenAt) =>
  files.map((file) => ({
    url: file.path,
    caption: caption || undefined,
    block: block || undefined,
    takenAt: takenAt ? new Date(takenAt) : undefined,
  }));

export const addWeeklyReportPhotos = catchAsync(async (req, res, next) => {
  const reportId = req.params.id;

  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'Please upload at least one photo.'));
  }

  const weeklyReport = await WeeklyReport.findById(reportId);
  if (!weeklyReport) {
    return next(new ApiError(404, 'No weekly report found with that ID'));
  }

  const attachments = buildWeeklyPhotoAttachments(
    req.files,
    req.body.caption,
    req.body.block,
    req.body.takenAt
  );
  weeklyReport.photos.push(...attachments);
  await weeklyReport.save();

  res.status(200).json({
    status: 'success',
    data: { photos: weeklyReport.photos },
  });
});
