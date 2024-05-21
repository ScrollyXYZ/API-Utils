import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true },
  owner: { type: String, required: true },
}, { versionKey: false });

tokenSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

const Token = mongoose.model('Token', tokenSchema);

export default Token;
