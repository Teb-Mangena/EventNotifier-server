import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    organization: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Bursary', 'In-Service', 'Jobs', 'Heckathons']
    },

    location: {
      type: String,
      required: true,
      trim: true,
      enum: ['On-site', 'Remote', 'Hybrid','N/A']
    },

    commitment: {
      type: String,
      required: true,
      trim: true
    },

    duration: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    skills: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  'Opportunity',
  OpportunitySchema
);
