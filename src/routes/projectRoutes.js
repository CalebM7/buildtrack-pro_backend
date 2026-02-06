import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// Middleware to parse 'blocks' if it's sent as a string
const parseBlocks = (req, res, next) => {
  if (req.body.blocks && typeof req.body.blocks === 'string') {
    try {
      req.body.blocks = JSON.parse(req.body.blocks);
    } catch (e) {
      return next(new ApiError('The "blocks" field is not a valid JSON string.', 400));
    }
  }
  next();
};

router.route('/')
    .get(projectController.getAllProjects)
    .post(
        restrictTo('super_admin', 'company_admin'), // Only admins can create projects
        parseBlocks,
        projectController.createProject
    );

router.route('/:id')
    .get(projectController.getProjectById)
    .patch(
        restrictTo('super_admin', 'company_admin', 'project_manager'), // Managers can update
        projectController.updateProject
    )
    .delete(
        restrictTo('super_admin'), // Only super admins can delete
        projectController.deleteProject
    );

export default router;
