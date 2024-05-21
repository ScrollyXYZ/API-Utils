import express from 'express';
import Token from '../models/token';

const router = express.Router();

router.get('/tokens', async (req, res) => {
  try {
    const tokens = await Token.find();
    res.json({ totalTokens: tokens.length, tokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/database-status', async (req, res) => {
    try {
      const totalTokens = await Token.countDocuments();
      res.json({ totalTokens });
    } catch (error) {
      console.error('Error fetching database status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

export default router;
