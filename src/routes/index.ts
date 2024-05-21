import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import Token from '../models/token';

const router = Router();

async function getTokenIdsByAddress(address: string): Promise<number[]> {
  const tokens = await Token.find({ owner: address.toLowerCase() });
  return tokens.map(token => token.tokenId);
}

router.get('/usernames', async (req: Request, res: Response) => {
  const { address } = req.query;

  if (!ethers.utils.isAddress(address as string)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  try {
    const tokenIds = await getTokenIdsByAddress(address as string);
    res.status(200).json({ tokenIds });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching token IDs' });
  }
});

router.get('/database-status', async (req: Request, res: Response) => {
  try {
    const totalTokens = await Token.countDocuments();
    res.status(200).json({ totalTokens });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching database status' });
  }
});

export default router;
