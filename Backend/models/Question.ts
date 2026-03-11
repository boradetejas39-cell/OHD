import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  sectionId: mongoose.Types.ObjectId;
  text: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    sectionId: {
      type: Schema.Types.ObjectId,
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

// Compound index to ensure unique order within section
QuestionSchema.index({ sectionId: 1, order: 1 }, { unique: true });

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;

