import { ethers } from "ethers";
import { Transfer, WalletMap } from "./types";
import { ETHEREUM_RPC_URL, MAX_TX_AMOUNT, MAX_TX_RETRIES, MAX_TRANSACTIONS } from "./config";
import { logTransferPlan } from "./plan";
import { logger, formatTitle, formatFooter, ansiRed, ansiYellow } from "./logger";

function checkSigner(walletMap: WalletMap, address: string, provider: ethers.Provider): ethers.Wallet {
  const wallet = walletMap[address];
  if (!wallet) {
    throw new Error(`Missing signer for ${address}`);
  }
  return wallet.connect(provider);
}

function checkMaxTxAmount(amount: bigint) {
  if (amount > MAX_TX_AMOUNT) {
    throw new Error(`Amount too large: ${ethers.formatEther(amount)}`);
  }
}

async function sendTransaction(signer: ethers.Wallet, to: string, amount: bigint) {
  const prefix = ansiRed("executing:");
  logger.info(`\n${prefix} Sending ${ethers.formatEther(amount)} ETH...`);

  for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
    try {
      const tx = await signer.sendTransaction({
        to,
        value: amount
      });

      logger.info(`${prefix} Tx sent: ${tx.hash}`);

      await tx.wait();

      logger.info(`${prefix} ✅ Confirmed`);
      return;
    } catch (err: any) {
      if (attempt === MAX_TX_RETRIES) {
        logger.info(`${prefix} ❌ Failed after ${MAX_TX_RETRIES} attempts.`);
        throw err;
      }
      
      const errMsg = err.shortMessage || err.message || "Unknown error";
      const warnPrefix = ansiYellow("executing:");
      logger.info(`${warnPrefix} ⚠️ Attempt ${attempt} failed (${errMsg}). Retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function sendTransfers(transfers: Transfer[], provider: ethers.Provider, walletMap: WalletMap) {
  let count = 0;
  for (const t of transfers) {
    if (count >= MAX_TRANSACTIONS) {
      logger.info(`${ansiYellow("warning")}: max. number of transactions (${MAX_TRANSACTIONS}) reached. Aborting transaction execution.`);
      break;
    }
    const signer = checkSigner(walletMap, t.from, provider);
    checkMaxTxAmount(t.amount);
    await sendTransaction(signer, t.to, t.amount);
    count++;
  }
}

export async function executePlan(
  transfers: Transfer[],
  walletMap: WalletMap,
  execute: boolean = false
) {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

  logTransferPlan(transfers);

  if (!execute) {
    logger.info("\n⚠️ Dry run only. No transactions executed.");
    if (transfers.length > MAX_TRANSACTIONS) {
      logger.info(`${ansiYellow("warning")}: max. number of transactions exceeded. rebalance will be executed partially.`);
    }
    return;
  }

  logger.info(formatTitle("EXECUTION"));

  if (transfers.length === 0) {
    logger.info("No executions required.");
  } else {
    await sendTransfers(transfers, provider, walletMap);
  }

  logger.info(formatFooter());
}