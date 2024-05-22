import { ethers } from 'ethers';
import Token from './models/token';
import Progress from './models/progress';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.RPC_URL || '',
  timeout: 1200000 // 120*10 seconds
});
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const limiter = new Bottleneck({
  minTime: 10000, // 10 seconds
  maxConcurrent: 1,
});

async function fetchOwner(tokenId: number) {
  console.log(`Fetching owner for token ${tokenId}`);
  try {
    const owner = await contract.ownerOf(tokenId);
    await Token.findOneAndUpdate({ tokenId }, { owner: owner.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} cached with owner ${owner}`);
    await updateProgress(tokenId);
  } catch (error) {
    console.error(`Error fetching owner for token ${tokenId}:`, error);
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
    for (let i = lastProcessedTokenId + 1; i <= idCounter; i++) {
      console.log(`Scheduling fetch for token ${i}`);
      limiter.schedule(() => fetchOwner(i));
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
        await limiter.schedule(() => fetchOwner(i));
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
          for (let i = currentIdCounter + 1; i <= newIdCounter; i++) {
            await limiter.schedule(() => fetchOwner(i));
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
