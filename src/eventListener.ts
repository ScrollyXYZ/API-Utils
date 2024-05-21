import { ethers } from 'ethers';
import Token from './models/token';
import { abi } from './config/abi';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

contract.on("Transfer", async (from, to, tokenId) => {
  try {
    await Token.findOneAndUpdate({ tokenId }, { owner: to.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} ownership updated to ${to}`);
  } catch (error) {
    console.error("Error updating token ownership:", error);
  }
});
