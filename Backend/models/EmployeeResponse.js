const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    rating: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E'],
      required: true,
    },
  },
  { _id: false }
);

const EmployeeResponseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    service: {
      type: String,
    },
    employeeEmail: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    employeeName: {
      type: String,
      trim: true,
    },
    answers: {
      type: [AnswerSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 70;
        },
        message: 'Exactly 70 answers are required',
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

EmployeeResponseSchema.index({ companyId: 1, employeeEmail: 1 }, { unique: true });

module.exports = mongoose.models.EmployeeResponse || mongoose.model('EmployeeResponse', EmployeeResponseSchema);

