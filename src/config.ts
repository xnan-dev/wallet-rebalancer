import * as dotenv from "dotenv";
import * as path from "path";
import { ethers } from "ethers";

dotenv.config();

export const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545";
export const WALLETS_DIR = process.env.WALLETS_DIR || path.join(process.cwd(), "wallets");
export const MAX_TX_AMOUNT = ethers.parseEther(process.env.MAX_TX_AMOUNT || "20000");
export const MIN_TX_AMOUNT = ethers.parseEther(process.env.MIN_TX_AMOUNT || "0.0050");
export const MAX_TX_RETRIES = parseInt(process.env.MAX_TX_RETRIES || "5");
export const MAX_TRANSACTIONS = parseInt(process.env.MAX_TRANSACTIONS || "20");
export const MIN_RESERVE_AMOUNT = ethers.parseEther(process.env.MIN_RESERVE_AMOUNT || "0.006");
export const MAX_GAS_PER_TOKEN_TX = BigInt(process.env.MAX_GAS_PER_TOKEN_TX || "100000");
export const DEFAULT_GAS_PRICE = ethers.parseUnits(process.env.DEFAULT_GAS_PRICE || "20", "gwei");
