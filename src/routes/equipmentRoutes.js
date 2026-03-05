import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
} from '../controllers/EquipmentController.js';

const router = express.Router();

// Every router in this module requires authentification
router.use(protect);

router
  .route('/')
  .post(
    // Write operations reserved for site + management roles
    restrictTo('super_admin', 'company_admin', 'project_manager', 'site_supervisor'),
    createEquipment
  )
  // Reads are available to authenticated users
  .get(getAllEquipment);

router.route('/:id')
  .get(getEquipmentById)
  .patch(
    restrictTo('super_admin', 'company_admin', 'project_manager', 'site_supervisor'),
    updateEquipment
  )
  // Delete can be restricted to admin roles for safer operations
  .delete(restrictTo('super_admin', 'company_admin'), deleteEquipment);

export default router;
