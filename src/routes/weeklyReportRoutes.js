import express from 'express'; // Router builder
import {
  addWeeklyReportPhotos,
  generateWeeklyReport,
  upsertWeeklyReport,
} from '../controllers/weeklyReportController.js'; // Controller actions
import { protect, restrictTo } from '../middleware/auth.js'; // Auth middlewares
import upload, { handleUploadErrors } from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All report routes require authentication

router.get(
  '/weekly', // GET /api/reports/weekly?projectId=...&startDate=...&endDate=...
  restrictTo('super_admin', 'company_admin', 'project_manager'), // Restrict to managers/admins
  generateWeeklyReport // Generate and return the PDF
);

router.post(
  '/weekly', // Create/update weekly report metadata
  restrictTo('super_admin', 'company_admin', 'project_manager'),
  upsertWeeklyReport
);

router.post(
  '/weekly/:id/photos',
  restrictTo('super_admin', 'company_admin', 'project_manager'),
  upload.array('photos', 10),
  handleUploadErrors,
  addWeeklyReportPhotos
);

export default router;
