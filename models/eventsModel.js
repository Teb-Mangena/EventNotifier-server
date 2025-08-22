import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  openingDate: {
    type: Date,
    required:true
  },
  closingDate: {
    type: Date,
    required: true
  }
},{timestamps:true})

const Event = mongoose.model('Event',eventSchema);

export default Event;