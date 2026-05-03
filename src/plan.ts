import { ethers } from "ethers";
import { WalletBalance, RebalanceResult, Transfer, MultiAssetRebalanceResult } from "./types";

import { logger, formatTitle, formatFooter, ansiYellow } from "./logger";
import { MIN_TX_AMOUNT } from "./config";

/**
 * Builds a transfer plan for a single asset.
 */
export function buildTransferPlan(
  results: RebalanceResult[], 
  asset: string, 
  decimals: number,
  contractAddress?: string
): Transfer[] {

  // Only apply MIN_TX_AMOUNT for ETH
  const minAmount = asset === "ETH" ? MIN_TX_AMOUNT : 0n;

  const senders = results
    .filter(r => r.delta < 0n) // Target < Balance => SEND (-)
    .map(r => ({ address: r.address, name: r.name, amount: -r.delta }));

  const receivers = results
    .filter(r => r.delta > 0n) // Target > Balance => RECEIVE (+)
    .map(r => ({
      address: r.address,
      name: r.name,
      amount: r.delta
    }));

  const transfers: Transfer[] = [];

  let i = 0;
  let j = 0;

  while (i < senders.length && j < receivers.length) {
    const sender = senders[i];
    const receiver = receivers[j];

    const amount =
      sender.amount < receiver.amount
        ? sender.amount
        : receiver.amount;

    if (amount > minAmount) {
      transfers.push({
        from: sender.address,
        fromName: sender.name,
        to: receiver.address,
        toName: receiver.name,
        amount,
        asset,
        decimals,
        contractAddress
      });

    }

    senders[i] = {
      ...sender,
      amount: sender.amount - amount
    };

    receivers[j] = {
      ...receiver,
      amount: receiver.amount - amount
    };

    if (senders[i].amount === 0n) i++;
    if (receivers[j].amount === 0n) j++;
  }

  return transfers;
}

/**
 * Builds transfer plans for all rebalanced assets.
 */
export function buildMultiAssetTransferPlan(multiResults: MultiAssetRebalanceResult[], contractConfig: ContractConfig | null): Transfer[] {
  const allTransfers: Transfer[] = [];
  for (const assetResult of multiResults) {
    const assetConfig = contractConfig?.assets[assetResult.asset];
    const assetPlan = buildTransferPlan(
      assetResult.results, 
      assetResult.asset, 
      assetResult.decimals,
      assetConfig?.address
    );
    allTransfers.push(...assetPlan);
  }
  return allTransfers;
}


/**
 * Logs transfer plans in a tabular format, grouped by asset.
 */
export function logTransferPlan(plan: Transfer[]) {
  if (plan.length === 0) {
    logger.info(formatTitle("TRANSFER PLAN"));
    logger.info("No transfer required.");
    logger.info(formatFooter());
    return;
  }

  const assets = [...new Set(plan.map(p => p.asset))];

  for (const asset of assets) {
    logger.info(formatTitle(`TRANSFER PLAN: ${asset}`));
    const assetTransfers = plan.filter(p => p.asset === asset);
    
    // Header
    const headers = ["From", "To", "Amount"];
    const headerStr = headers[0].padEnd(24) + headers[1].padEnd(24) + headers[2].padEnd(20);
    logger.info(headerStr);
    logger.info("-".repeat(headerStr.length));

    for (const p of assetTransfers) {
      const fromShortAddr = `(...${p.from.slice(-4)})`;
      const fromIdent = p.fromName ? `${p.fromName} ${fromShortAddr}` : p.from;
      
      const toShortAddr = `(...${p.to.slice(-4)})`;
      const toIdent = p.toName ? `${p.toName} ${toShortAddr}` : p.to;
      
      const amount = ethers.formatUnits(p.amount, p.decimals);

      const row = [
        fromIdent.padEnd(24),
        toIdent.padEnd(24),
        amount.padEnd(20)
      ];
      logger.info(row.join(" "));
    }

    
    const totalVolume = assetTransfers.reduce((acc, p) => acc + p.amount, 0n);
    const decimals = assetTransfers[0].decimals;
    
    logger.info("-".repeat(headerStr.length));
    logger.info(`Total Volume: ${ethers.formatUnits(totalVolume, decimals)} ${asset}`);
    logger.info(formatFooter());
    logger.info("");
  }
}