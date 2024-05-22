import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  lastProcessedTokenId: { type: Number, required: true }
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
