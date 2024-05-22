import { ethers } from 'ethers';
import Token from './models/token';
import Progress from './models/progress';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const limiter = new Bottleneck({
  minTime: 10000, // 10 seconds
  maxConcurrent: 1,
});

async function fetchOwner(tokenIds: number[]) {
  console.log(`Fetching owners for tokens ${tokenIds}`);
  try {
    const ownerPromises = tokenIds.map(async (tokenId) => {
      const owner = await contract.ownerOf(tokenId);
      await Token.findOneAndUpdate({ tokenId }, { owner: owner.toLowerCase() }, { upsert: true });
      await updateProgress(tokenId);
      return owner;
    });

    const owners = await Promise.all(ownerPromises);
    owners.forEach((owner, idx) => {
      console.log(`Token ${tokenIds[idx]} cached with owner ${owner}`);
    });
  } catch (error) {
    console.error(`Error fetching owners for tokens ${tokenIds}:`, error);
  }
}

async function updateProgress(tokenId: number) {
  try {
    await Progress.findOneAndUpdate({}, { lastProcessedTokenId: tokenId }, { upsert: true });
    console.log(`Progress updated to token ${tokenId}`);
  } catch (error) {
    console.error(`Error updating progress for token ${tokenId}:`, error);
  }
}

async function getLastProcessedTokenId(): Promise<number> {
  try {
    const progress = await Progress.findOne();
    return progress ? progress.lastProcessedTokenId : 0;
  } catch (error) {
    console.error('Error getting last processed token ID:', error);
    return 0;
  }
}

export async function buildCache() {
  try {
    const idCounter = (await contract.idCounter()).toNumber();
    console.log(`Total tokens to fetch: ${idCounter}`);

    const lastProcessedTokenId = await getLastProcessedTokenId();
    for (let i = lastProcessedTokenId + 1; i <= idCounter; i += 5) {
      const tokenIds: number[] = [];
      for (let j = 0; j < 5 && (i + j) <= idCounter; j++) {
        tokenIds.push(i + j);
      }
      console.log(`Scheduling fetch for tokens ${tokenIds}`);
      limiter.schedule(() => fetchOwner(tokenIds));
    }

    console.log('All fetch tasks have been scheduled.');
  } catch (error) {
    console.error("Error building cache:", error);
  }
}

export async function recoverMissingData() {
  try {
    const idCounter = (await contract.idCounter()).toNumber();
    console.log(`Recovering missing data up to token ${idCounter}`);

    for (let i = 1; i <= idCounter; i++) {
      const token = await Token.findOne({ tokenId: i });
      if (!token) {
        console.log(`Token ${i} is missing. Scheduling fetch.`);
        await limiter.schedule(() => fetchOwner([i]));
      }
    }

    console.log('Missing data recovery tasks have been scheduled.');
  } catch (error) {
    console.error("Error recovering missing data:", error);
  }
}

export async function monitorIdCounter() {
  try {
    const initialIdCounter = (await contract.idCounter()).toNumber();
    let currentIdCounter = initialIdCounter;
    console.log(`Initial ID Counter: ${initialIdCounter}`);

    setInterval(async () => {
      try {
        const newIdCounter = (await contract.idCounter()).toNumber();
        if (newIdCounter > currentIdCounter) {
          console.log(`New tokens detected. Updating cache from ${currentIdCounter + 1} to ${newIdCounter}`);
          for (let i = currentIdCounter + 1; i <= newIdCounter; i += 5) {
            const tokenIds: number[] = [];
            for (let j = 0; j < 5 && (i + j) <= newIdCounter; j++) {
              tokenIds.push(i + j);
            }
            await limiter.schedule(() => fetchOwner(tokenIds));
          }
          currentIdCounter = newIdCounter;
        } else {
          console.log("No new tokens detected.");
        }
      } catch (error) {
        console.error("Error monitoring idCounter:", error);
      }
    }, 600000); // Check every 10 minutes
  } catch (error) {
    console.error("Error initializing idCounter monitoring:", error);
  }
}

monitorIdCounter(); // Start monitoring the idCounter
