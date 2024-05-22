import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';
import Bottleneck from 'bottleneck';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const provider = new ethers.providers.JsonRpcProvider({
  url: process.env.RPC_URL || '',
  timeout: 120000 // 120 seconds
});
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const limiter = new Bottleneck({
  minTime: 10000, // 10 seconds
  maxConcurrent: 1,
});

async function handleTransfer(from: string, to: string, tokenId: ethers.BigNumber) {
  try {
    await Token.findOneAndUpdate({ tokenId: tokenId.toNumber() }, { owner: to.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId.toNumber()} ownership updated to ${to}`);
  } catch (error) {
    console.error(`Error updating token ownership for token ${tokenId.toNumber()}:`, error);
  }
}

contract.on("Transfer", (from, to, tokenId) => {
  limiter.schedule(() => handleTransfer(from, to, tokenId));
});

console.log("Event listener for transfers initialized.");
