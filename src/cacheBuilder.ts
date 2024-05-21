import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const limiter = new Bottleneck({
  minTime: parseInt(process.env.FETCH_INTERVAL || '60000'),
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
  console.log('Starting cache build process...');
  try {
    const idCounter = await contract.idCounter();
    console.log(`Total tokens to fetch: ${idCounter.toString()}`);
    for (let i = 1; i <= idCounter; i++) {
      await limiter.schedule(() => fetchOwner(i));
    }
  } catch (error) {
    console.error("Error building cache:", error);
  }
}

export async function monitorIdCounter() {
  console.log('Starting idCounter monitoring...');
  try {
    let previousIdCounter = await contract.idCounter();
    setInterval(async () => {
      const currentIdCounter = await contract.idCounter();
      if (currentIdCounter.gt(previousIdCounter)) {
        console.log(`New tokens detected: ${currentIdCounter.sub(previousIdCounter).toString()} new tokens`);
        for (let i = previousIdCounter.toNumber() + 1; i <= currentIdCounter.toNumber(); i++) {
          await limiter.schedule(() => fetchOwner(i));
        }
        previousIdCounter = currentIdCounter;
      }
    }, parseInt(process.env.MONITOR_INTERVAL || '120000')); // Default to check every 2 minutes
  } catch (error) {
    console.error("Error monitoring idCounter:", error);
  }
}
