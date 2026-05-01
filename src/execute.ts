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

async function sendTransaction(signer: ethers.Wallet, transfer: Transfer, currentIdx: number, totalTransfers: number) {
  const fromStr = transfer.fromName || transfer.from;
  const toStr = transfer.toName || transfer.to;

  logger.info(`\n[${currentIdx}/${totalTransfers}] ${fromStr} → ${toStr}`);
  
  const balance = await signer.provider!.getBalance(signer.address);
  const feeData = await signer.provider!.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;
  const gasLimit = 21000n;
  const gasCost = gasPrice * gasLimit;

  let amount = transfer.amount;
  if (amount + gasCost > balance) {
    amount = balance - gasCost;
    if (amount <= 0n) {
      logger.info(`      Amount: ${ethers.formatEther(transfer.amount)} ETH`);
      logger.info(`      ⚠️ Insufficient funds for gas fee (${ethers.formatEther(gasCost)} ETH). Skipping.`);
      return;
    }
    logger.info(`      Amount: ${ethers.formatEther(transfer.amount)} ETH (Adjusted to ${ethers.formatEther(amount)} ETH to cover gas)`);
  } else {
    logger.info(`      Amount: ${ethers.formatEther(amount)} ETH`);
  }

  for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
    try {
      const tx = await signer.sendTransaction({
        to: transfer.to,
        value: amount,
        gasLimit,
        gasPrice
      });

      logger.info(`      TX: ${tx.hash}`);

      await tx.wait();

      logger.info(`      Status: CONFIRMED`);
      return;
    } catch (err: any) {
      if (attempt === MAX_TX_RETRIES) {
        logger.info(`      Status: FAILED (${MAX_TX_RETRIES} attempts)`);
        throw err;
      }
      
      const errMsg = err.shortMessage || err.message || "Unknown error";
      logger.info(`      ⚠️ Attempt ${attempt} failed (${errMsg}). Retrying in 2s...`);
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
    await sendTransaction(signer, t, count + 1, transfers.length);
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

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;
  const estimatedCost = gasPrice * 21000n * BigInt(transfers.length);

  logger.info(formatTitle("GAS ESTIMATE"));
  logger.info(`Estimated TXs: ${transfers.length}`);
  logger.info(`Estimated Gas: ~${ethers.formatEther(estimatedCost)} ETH`);
  logger.info(formatFooter());

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