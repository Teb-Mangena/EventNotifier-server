import express from 'express';
import {
  getOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  createOpportunity
} from '../controllers/opportunityControllers.js';

const router = express.Router();

router
  .route('/')
  .post(createOpportunity)
  .get(getOpportunities);

router
  .route('/:id')
  .get(getOpportunityById)
  .patch(updateOpportunity)
  .delete(deleteOpportunity);

export default router;
