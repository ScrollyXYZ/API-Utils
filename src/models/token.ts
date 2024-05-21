import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenId: Number,
  owner: String,
});

const Token = mongoose.model('Token', tokenSchema);

export default Token;
