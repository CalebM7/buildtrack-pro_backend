import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes here are protected
router.use(protect);

// Admin-only management routes
router.use(restrictTo('super_admin', 'company_admin'));

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// Stricter restriction: Only Super Admin can change roles
router.patch(
  '/:id/role',
  restrictTo('super_admin'),
  userController.updateUserRole
);

export default router;
