import { ethers } from 'ethers';
import cron from 'node-cron';
import Token from './models/token';
import { ABI } from './config/abi';

const CONTRACT_ADDRESS = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";
const provider = new ethers.providers.JsonRpcProvider('https://scroll.drpc.org');
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

// Schedule cache construction to run every minute
cron.schedule('*/1 * * * *', async () => {
  await buildCache();
});
