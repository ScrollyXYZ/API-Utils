import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const WAIT_TIME_MS = parseInt(process.env.WAIT_TIME_MS || '1000', 10);

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function buildCache() {
  try {
    const idCounter = await contract.idCounter();
    for (let i = 1; i <= idCounter; i++) {
      const owner = await contract.ownerOf(i);
      await Token.findOneAndUpdate({ tokenId: i }, { owner: owner.toLowerCase() }, { upsert: true });
      console.log(`Token ${i} cached with owner ${owner}`);
      await wait(WAIT_TIME_MS); // Use the wait time from environment variables
    }
  } catch (error) {
    console.error("Error building cache:", error);
  }
}
