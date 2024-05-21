import { ethers } from 'ethers';
import Token from './models/token';
import { ABI } from './config/abi';

const CONTRACT_ADDRESS = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";
const provider = new ethers.providers.JsonRpcProvider('https://scroll.drpc.org');
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

contract.on("Transfer", async (from, to, tokenId) => {
  try {
    await Token.findOneAndUpdate({ tokenId }, { owner: to.toLowerCase() }, { upsert: true });
    console.log(`Token ${tokenId} ownership updated to ${to}`);
  } catch (error) {
    console.error("Error updating token ownership:", error);
  }
});
