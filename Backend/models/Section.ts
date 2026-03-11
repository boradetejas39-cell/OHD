import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISection extends Document {
  name: string;
  description?: string;
  pillar: number; // 1-5 for the 5 pillars
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema: Schema = new Schema(
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

const Section: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);

export default Section;

