import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

contract.on("Transfer", async (from, to, tokenId) => {
  try {
    await Token.findOneAndUpdate({ tokenId }, { owner: to.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} ownership updated to ${to}`);
  } catch (error) {
    console.error("Error updating token ownership:", error);
  }
});
