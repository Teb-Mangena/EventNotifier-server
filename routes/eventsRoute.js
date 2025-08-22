import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} from '../controllers/eventsController.js';
import { upload } from '../lib/cloudinary.js';

const router = express.Router();

router
  .route('/')
  .get(getEvents)
  .post(
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]), createEvent);

router
  .route('/:id')
  .get(getEventById)
  .patch(updateEvent)
  .delete(deleteEvent);

export default router;
