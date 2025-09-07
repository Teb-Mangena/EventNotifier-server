import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventRegisterSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  userDetails: {
    name: { type: String, required: true },
    surname: { type: String, required: true },
  }
},{timestamps:true});

const EventRegister = mongoose.model('EventRegister',eventRegisterSchema, 'event_registrations');

export default EventRegister;