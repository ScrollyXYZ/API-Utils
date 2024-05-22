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

async function handleTransfer(from: string, to: string, tokenId: ethers.BigNumber) {
  try {
    await Token.findOneAndUpdate({ tokenId: tokenId.toNumber() }, { owner: to.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} ownership updated to ${to}`);
  } catch (error) {
    console.error(`Error updating token ownership for token ${tokenId}:`, error);
  }
}

// Listen for Transfer events
contract.on("Transfer", (from, to, tokenId) => {
  limiter.schedule(() => handleTransfer(from, to, tokenId));
});
