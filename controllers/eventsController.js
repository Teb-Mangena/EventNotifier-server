import { format } from 'date-fns';
import { v2 as cloudinary } from 'cloudinary';
import uploadFromBuffer from '../lib/cloudinary.js';
import Event from '../models/eventsModel.js';
import User from '../models/userModel.js'
import sendEmail from '../utils/emailService.js';
import mongoose from 'mongoose';

export const createEvent = async (req, res) => {
  try {
    const { title, description, location, openingDate, closingDate } = req.body;
    const imageFile = req.files?.image?.[0];

    let imageData = null;

    // Process image
    if (imageFile) {
      const imageResult = await uploadFromBuffer(imageFile.buffer, {
        resourceType: 'image'
      });

      imageData = {
        url: imageResult.secure_url,
        publicId: imageResult.public_id
      };
    }

    // Save event in DB
    const event = await Event.create({ 
      title, 
      description, 
      image: imageData,
      location, 
      openingDate, 
      closingDate
    });

    res.status(201).json(event);

    // Get all user emails
    const users = await User.find({}, 'email -_id'); 
    const emailList = users.map(u => u.email).filter(Boolean);

    if (emailList.length === 0) {
      console.warn('⚠️ No user emails found');
      return;
    }

    // Format dates for readability
    const formattedOpening = format(new Date(openingDate), "EEE, dd MMM yyyy, hh:mm a");
    const formattedClosing = format(new Date(closingDate), "EEE, dd MMM yyyy, hh:mm a");

    // Email body content
    const plainTextMessage = `Hello!

A new event has just been posted:

${title}
${description}

📍 Location: ${location}
🕒 Opens: ${formattedOpening}
🕒 Closes: ${formattedClosing}

See you there!`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
        <h2 style="color: #2c3e50; margin-bottom: 8px;">${title}</h2>
        <p>${description}</p>
        <p><strong>📍 Location:</strong> ${location}</p>
        <p><strong>🕒 Opens:</strong> ${formattedOpening}</p>
        <p><strong>🕒 Closes:</strong> ${formattedClosing}</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/events/${event._id}" 
             style="background: #007BFF; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Event Details
          </a>
        </p>
        <hr style="margin-top: 30px;"/>
        <small style="color: #777;">You are receiving this email because you are subscribed to WSU Event Notifier updates.</small>
      </div>
    `;

    // Send individually to avoid bulk spam flagging
    for (const email of emailList) {
      sendEmail({
        to: email,
        subject: `📅 New Event: ${title} — Mark Your Calendar`,
        text: plainTextMessage,
        html: htmlMessage
      }).catch(err => console.error(`❌ Email to ${email} failed: ${err.message}`));
    }

  } catch (err) {
    console.error('createEvent error:', err);
    res.status(400).json({ message: err.message });
  }
};


// Get all events (with basic pagination)
export const getEvents = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  ) || 1;
    const limit = parseInt(req.query.limit ) || 20;
    const skip  = (page - 1) * limit;

    const total = await Event.countDocuments();
    const events = await Event.find()
      .sort({ openingDate: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ total, page, limit, data: events });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: 'Could not fetch events' });
  }
};

// Get a single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error('getEventById error:', err);
    res.status(500).json({ message: 'Could not fetch the event' });
  }
};

// Update an existing event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Delete an event (and its Cloudinary image if present)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // If an image is attached, try to delete it from Cloudinary
    if (event.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(event.image.publicId);
        console.log(`🗑️ Cloudinary image deleted: ${event.image.publicId}`);
      } catch (cloudErr) {
        console.error(`⚠️ Failed to delete Cloudinary image (${event.image.publicId}):`, cloudErr.message);
      }
    }

    // Remove the event from the DB
    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event and associated image deleted successfully' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ message: 'Could not delete the event' });
  }
};

