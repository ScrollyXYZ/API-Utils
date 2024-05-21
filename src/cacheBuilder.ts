import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Set up Bottleneck
const limiter = new Bottleneck({
  minTime: 1000, // Set to 1 second for testing purposes
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
    const idCounter = (await contract.idCounter()).toNumber();
    console.log(`Total tokens to fetch: ${idCounter}`);

    for (let i = 1; i <= idCounter; i++) {
      console.log(`Scheduling fetch for token ${i}`);
      limiter.schedule(() => fetchOwner(i));
    }

    console.log('All fetch tasks have been scheduled.');
  } catch (error) {
    console.error("Error building cache:", error);
  }
}

async function monitorIdCounter() {
  try {
    const initialIdCounter = (await contract.idCounter()).toNumber();
    let currentIdCounter = initialIdCounter;
    console.log(`Initial ID Counter: ${initialIdCounter}`);

    setInterval(async () => {
      try {
        const newIdCounter = (await contract.idCounter()).toNumber();
        if (newIdCounter > currentIdCounter) {
          console.log(`New tokens detected. Updating cache from ${currentIdCounter + 1} to ${newIdCounter}`);
          for (let i = currentIdCounter + 1; i <= newIdCounter; i++) {
            limiter.schedule(() => fetchOwner(i));
          }
          currentIdCounter = newIdCounter;
        }
      } catch (error) {
        console.error("Error monitoring idCounter:", error);
      }
    }, 120000); // Check every 2 minutes
  } catch (error) {
    console.error("Error initializing idCounter monitoring:", error);
  }
}

monitorIdCounter(); // Start monitoring the idCounter
