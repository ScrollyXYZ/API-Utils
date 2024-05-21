import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Set up Bottleneck
const limiter = new Bottleneck({
  minTime: parseInt(process.env.FETCH_INTERVAL || '60000'), // Default to 1 request per minute
});

async function fetchOwner(tokenId: number) {
  console.log(`Fetching owner for token ${tokenId}`);
  try {
    const owner = await contract.ownerOf(tokenId);
    await Token.findOneAndUpdate({ tokenId }, { owner: owner.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} cached with owner ${owner}`);
  } catch (error) {
    console.error(`Error fetching owner for token ${tokenId}:`, error);
  }
}

export async function buildCache() {
  try {
    const idCounter = await contract.idCounter();
    const totalTokens = idCounter.toNumber();
    console.log(`idCounter: ${totalTokens}`);
    
    for (let i = 1; i <= totalTokens; i++) {
      await limiter.schedule(() => fetchOwner(i));
    }
  } catch (error) {
    console.error("Error building cache:", error);
  }
}
