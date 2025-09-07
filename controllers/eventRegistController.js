import EventRegister from "../models/eventRegister.js";
import Event from "../models/eventsModel.js";
import User from "../models/userModel.js";

/**
 * @desc Register the logged-in user for an event
 * @route POST /api/event-register
 * @access Private
 */
export const registerForEvent = async (req, res) => {
  try {
    // Get eventId from URL params
    const { eventId } = req.params;

    // Get logged-in user from req.user (set by protect middleware)
    const { id: userId, name, surname } = req.user;

    // Validate event existence
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Prevent duplicate registration
    const alreadyRegistered = await EventRegister.findOne({ eventId, userId });
    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // Create registration
    const registration = await EventRegister.create({
      eventId,
      userId,
      userDetails: { name, surname }
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * @desc Get all registrations (optionally filter by eventId)
 * @route GET /api/event-register
 * @access Private/Admin
 */
export const getRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { eventId } : {};

    const registrations = await EventRegister.find(filter)
      .populate("eventId", "title date location")
      .populate("userId", "name email");

    res.status(200).json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get a single registration by ID
 * @route GET /api/event-register/:id
 * @access Private
 */
export const getRegistrationById = async (req, res) => {
  try {
    const registration = await EventRegister.findById(req.params.id)
      .populate("eventId", "title date location")
      .populate("userId", "name email");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json(registration);
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Delete a registration (only owner or admin)
 * @route DELETE /api/event-register/:id
 * @access Private
 */
export const deleteRegistration = async (req, res) => {
  try {
    const registration = await EventRegister.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Ownership enforcement: only the user who registered or an admin can delete
    if (registration.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this registration" });
    }

    await registration.deleteOne();
    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};
