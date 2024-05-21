import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { connectToDatabase } from './utils/database';
import Token from './models/token';
import cron from 'node-cron';
import ABI from './utils/ABI';

const app = express();
const port = process.env.PORT || 3000;
const rpcUrl = process.env.RPC_URL;

app.use(cors());
app.use(express.json());

if (!rpcUrl) {
  console.error("RPC URL is not defined. Please set it in the .env file.");
  process.exit(1);
}

// Utility functions to get token data
async function getTokenIds(address: string) {
  const tokens = await Token.find({ owner: address.toLowerCase() });
  return tokens.map(token => token.tokenId);
}

async function buildCache() {
  const CONTRACT_ADDRESS = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  try {
    const idCounter = await contract.idCounter();
    console.log(`Total Tokens to cache: ${idCounter}`);
    for (let i = 1; i <= idCounter; i++) {
      try {
        const owner = await contract.ownerOf(i);
        await Token.findOneAndUpdate({ tokenId: i }, { owner: owner.toLowerCase() }, { upsert: true });
        console.log(`Token ${i} cached with owner ${owner}`);
      } catch (error) {
        console.error(`Error caching token ${i}:`, error);
      }
    }
  } catch (error) {
    console.error("Error building cache:", error);
  }
}

// Schedule cache construction to run every minute
cron.schedule('*/1 * * * *', async () => {
  await buildCache();
});

app.get('/api/usernames', async (req, res) => {
  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    res.status(400).send('Invalid address');
    return;
  }

  try {
    const tokenIds = await getTokenIds(address);
    res.status(200).json({ totalTokens: tokenIds.length, tokenIds });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching token data' });
  }
});

app.get('/api/cache-status', async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    res.status(200).json({ totalTokens });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cache status' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectToDatabase().then(() => {
    console.log('Database connection established');
  }).catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1); // Exit the process with an error code if DB connection fails
  });
});
