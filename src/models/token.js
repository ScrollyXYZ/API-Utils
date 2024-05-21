const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenId: Number,
  owner: String,
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
