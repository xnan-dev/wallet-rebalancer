import { ethers } from "ethers";
import { Transfer, WalletMap } from "./types";
import { ETHEREUM_RPC_URL, MAX_TX_AMOUNT, MAX_TX_RETRIES, MAX_TRANSACTIONS, MAX_GAS_PER_TOKEN_TX, DEFAULT_GAS_PRICE } from "./config";
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
  
  const ethBalance = await signer.provider!.getBalance(signer.address);
  const feeData = await signer.provider!.getFeeData();
  const gasPrice = feeData.gasPrice || DEFAULT_GAS_PRICE;
  
  // Standard ETH transfer gas limit is 21k, ERC20 typically needs more. Setting safe ceiling from config.
  const gasLimit = transfer.asset === "ETH" ? 21000n : MAX_GAS_PER_TOKEN_TX;
  const gasCost = gasPrice * gasLimit;

  if (ethBalance < gasCost) {
    logger.info(`      Amount: ${ethers.formatUnits(transfer.amount, transfer.decimals)} ${transfer.asset}`);
    logger.info(`      ⚠️ Insufficient ETH for gas fee (${ethers.formatEther(gasCost)} ETH). Skipping.`);
    return;
  }

  let finalAmount = transfer.amount;

  // For ETH, we might need to adjust the amount to leave room for gas
  if (transfer.asset === "ETH") {
    if (finalAmount + gasCost > ethBalance) {
      finalAmount = ethBalance - gasCost;
      if (finalAmount <= 0n) {
        logger.info(`      Amount: ${ethers.formatEther(transfer.amount)} ETH`);
        logger.info(`      ⚠️ Insufficient funds for gas fee after adjustment. Skipping.`);
        return;
      }
      logger.info(`      Amount: ${ethers.formatEther(transfer.amount)} ETH (Adjusted to ${ethers.formatEther(finalAmount)} ETH to cover gas)`);
    } else {
      logger.info(`      Amount: ${ethers.formatEther(finalAmount)} ETH`);
    }
  } else {
    logger.info(`      Amount: ${ethers.formatUnits(finalAmount, transfer.decimals)} ${transfer.asset}`);
  }

  for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
    try {
      let tx;
      if (transfer.asset === "ETH") {
        tx = await signer.sendTransaction({
          to: transfer.to,
          value: finalAmount,
          gasLimit,
          gasPrice
        });
      } else {
        if (!transfer.contractAddress) {
          throw new Error(`Missing contract address for ${transfer.asset}`);
        }
        const contract = new ethers.Contract(
          transfer.contractAddress,
          ["function transfer(address to, uint256 amount) public returns (bool)"],
          signer
        );
        tx = await contract.transfer(transfer.to, finalAmount, { gasLimit, gasPrice });
      }

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

  const ethTxs = transfers.filter(t => t.asset === "ETH").length;
  const erc20Txs = transfers.length - ethTxs;
  
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || DEFAULT_GAS_PRICE;
  const estimatedCost = gasPrice * (21000n * BigInt(ethTxs) + MAX_GAS_PER_TOKEN_TX * BigInt(erc20Txs));

  logger.info(formatTitle("GAS ESTIMATE"));
  logger.info(`Estimated TXs: ${transfers.length} (${ethTxs} ETH, ${erc20Txs} ERC20)`);
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