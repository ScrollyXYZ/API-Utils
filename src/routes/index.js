const express = require('express');
const { ethers } = require('ethers');
const Token = require('../models/token');

const router = express.Router();

async function getTokenIdsByAddress(address) {
  const tokens = await Token.find({ owner: address.toLowerCase() });
  return tokens.map(token => token.tokenId);
}

router.get('/usernames', async (req, res) => {
  const { address } = req.query;

  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  try {
    const tokenIds = await getTokenIdsByAddress(address);
    res.status(200).json({ tokenIds });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching token IDs' });
  }
});

router.get('/database-status', async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    res.status(200).json({ totalTokens });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching database status' });
  }
});

module.exports = router;
