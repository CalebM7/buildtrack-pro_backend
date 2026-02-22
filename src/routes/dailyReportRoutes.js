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
} from '../controllers/dailyReportController.js';

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

export default router;
