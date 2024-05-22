import mongoose, { Schema, Document } from 'mongoose';

interface IProgress extends Document {
  lastProcessedTokenId: number;
}

const ProgressSchema: Schema = new Schema({
  lastProcessedTokenId: { type: Number, required: true, default: 0 },
});

export default mongoose.model<IProgress>('Progress', ProgressSchema);
