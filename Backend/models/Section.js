const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pillar: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique order within each pillar
SectionSchema.index({ pillar: 1, order: 1 }, { unique: true });

module.exports = mongoose.models.Section || mongoose.model('Section', SectionSchema);

