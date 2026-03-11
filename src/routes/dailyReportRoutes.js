import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';

import {
  createDailyReport,
  getAllDailyReports,
  getDailyReportById,
  updateDailyReport,
  deleteDailyReport,
  addConcern,
  updateConcern,
  deleteConcern,
  addActivityPhotos, 
  addConcernPhotos
} from '../controllers/dailyReportController.js';
import upload, { handleUploadErrors } from '../middleware/upload.js';



const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    createDailyReport
  )
  .get(getAllDailyReports);

router
  .route('/:id')
  .get(getDailyReportById)
  .patch(
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    updateDailyReport
  )
  .delete(restrictTo('super_admin'), deleteDailyReport);

// Nested concerns
router
  .route('/:id/concerns')
  .post(
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    addConcern
  );

router
  .route('/:id/concerns/:concernId')
  .patch(
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    updateConcern
  )
  .delete(
    restrictTo('super_admin', 'company_admin', 'project_manager'),
    deleteConcern
  );

router
  .route('/:id/teams/:teamId/activities/:activityId/photos')
  .post(
    restrictTo('super_admin', 'company_admin', 'project_manager', 'site_supervisor'),
    upload.array('photos', 10), // Expect multiple photos under the "photos" key
    handleUploadErrors, // Normalize Multer errors to ApiError
    addActivityPhotos
  );

router
  .route('/:id/concerns/:concernId/photos')
  .post(
    restrictTo('super_admin', 'company_admin', 'project_manager', 'site_supervisor'),
    upload.array('photos', 10), // Same photo key as activity uploads
    handleUploadErrors, // Normalize Multer errors to ApiError
    addConcernPhotos
  );

export default router;
