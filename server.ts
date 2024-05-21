import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import cron from 'node-cron';
import Token from './models/token';
import { ABI } from './utils/ABI';
import './utils/database';  // This will import and run the database connection logic

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CONTRACT_ADDRESS = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

async function buildCache() {
  try {
    const idCounter = await contract.idCounter();
    for (let i = 1; i <= idCounter; i++) {
      const owner = await contract.ownerOf(i);
      await Token.findOneAndUpdate({ tokenId: i }, { owner: owner.toLowerCase() }, { upsert: true });
      console.log(`Token ${i} cached with owner ${owner}`);
    }
  } catch (error) {
    console.error("Error building cache:", error);
  }
}

cron.schedule('*/1 * * * *', async () => {
  await buildCache();
});

app.get('/api/tokens', async (req, res) => {
  try {
    const tokens = await Token.find({});
    res.status(200).json({ totalTokens: tokens.length, tokens });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tokens' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
