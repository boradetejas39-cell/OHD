const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
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

QuestionSchema.index({ sectionId: 1, order: 1 }, { unique: true });

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

