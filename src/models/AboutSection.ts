import mongoose from 'mongoose';

const AboutSectionSchema = new mongoose.Schema(
  {
    smallLabel: { type: String, required: true },
    mainHeading: { type: String, required: true },
    paragraph1: { type: String, required: true },
    paragraph2: { type: String, default: '' },
    quoteText: { type: String, default: '' },
    mainImage: { type: String, required: true },
    ctaButtonText: { type: String, required: true },
    ctaButtonLink: { type: String, required: true },
    trustCards: [
      {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'about_sections'
  }
);

export default mongoose.models.AboutSection || mongoose.model('AboutSection', AboutSectionSchema);
