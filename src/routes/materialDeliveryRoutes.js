// Express router for material-delivery endpoints
import express from 'express';
// Auth + role middleware
import { protect, restrictTo } from '../middleware/auth.js';
// Controller methods
import {
  createMaterialDelivery,
  getAllMaterialDeliveries,
  getMaterialDeliveryById,
  updateMaterialDelivery,
  deleteMaterialDelivery,
} from '../controllers/MaterialDeliveryController.js';

// Create isolated router module
const router = express.Router();

// Apply auth gate to all routes below
router.use(protect);

// Collection route: create + list
router
  .route('/')
  .post(
    // Only operational/admin roles can create records
    restrictTo('super_admin', 'company_admin', 'site_supervisor'),
    createMaterialDelivery
  )
  // Only admin/operational roles can list records, but all authenticated users can read
  .get(getAllMaterialDeliveries);

// Single-resource route: read + update + delete
router
  .route('/:id')
  .get(getMaterialDeliveryById)
  .patch(
    // Same roles allowed to update
    restrictTo('super_admin', 'company_admin', 'site_supervisor'),
    updateMaterialDelivery
  )
  // Deletion restricted to admin roles
  .delete(
    restrictTo('super_admin', 'company_admin'),
    deleteMaterialDelivery
  );

// Export router to mount in app.js
export default router;
