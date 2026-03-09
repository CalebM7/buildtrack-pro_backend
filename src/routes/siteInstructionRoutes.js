import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  createSiteInstruction,
  getAllSiteInstructions,
  getSiteInstructionById,
  updateSiteInstruction,
  deleteSiteInstruction,
} from '../controllers/siteInstructionController.js';

const router = express.Router();

// All site-instruction endpoints require authenticated access
router.use(protect);

router
  .route('/')
  .post(
    // Operational + management roles can issue instructions
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    createSiteInstruction
  )
  // Any authenticated user can read for coordination visibility
  .get(getAllSiteInstructions);

router
  .route('/:id')
  .get(getSiteInstructionById)
  .patch(
    // Same write roles can update status/details
    restrictTo(
      'super_admin',
      'company_admin',
      'project_manager',
      'site_supervisor'
    ),
    updateSiteInstruction
  )
  // Deletion restricted to admin roles
  .delete(restrictTo('super_admin', 'company_admin'), deleteSiteInstruction);

export default router;
