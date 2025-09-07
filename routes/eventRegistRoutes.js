import express from "express";
import {
  registerForEvent,
  getRegistrations,
  getRegistrationById,
  deleteRegistration
} from "../controllers/eventRegistController.js";
import requireAuth from '../middlewares/requireAuth.js';

const router = express.Router();

router.post("/:eventId", requireAuth, registerForEvent);

router.get("/", getRegistrations);

router.get("/:id", requireAuth, getRegistrationById);

router.delete("/:id", requireAuth, deleteRegistration);

export default router;
