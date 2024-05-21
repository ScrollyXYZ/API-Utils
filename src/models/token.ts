import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true },
  owner: { type: String, required: true },
});

const Token = mongoose.model('Token', tokenSchema);

export default Token;
