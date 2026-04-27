import { ethers } from "ethers";
import { WalletBalance, RebalanceResult, Transfer } from "./types";
import { logger, formatTitle, formatFooter, ansiYellow } from "./logger";
import { MIN_TX_AMOUNT } from "./config";

export function buildTransferPlan(results: RebalanceResult[]): Transfer[] {
  const senders = results
    .filter(r => r.delta > 0n)
    .map(r => ({ address: r.address, name: r.name, amount: r.delta }));

  const receivers = results
    .filter(r => r.delta < 0n)
    .map(r => ({
      address: r.address,
      name: r.name,
      amount: -r.delta
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

    if (amount >= MIN_TX_AMOUNT) {
      transfers.push({
        from: sender.address,
        fromName: sender.name,
        to: receiver.address,
        toName: receiver.name,
        amount
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

export function logTransferPlan(plan: Transfer[]) {
  logger.info(formatTitle("TRANSFER PLAN"));

  if (plan.length === 0) {
    logger.info("No transfer required.");
  } else {
    let totalVolume = 0n;
    for (const p of plan) {
      totalVolume += p.amount;
      const shortFrom = `(...${p.from.slice(-4)})`;
      const shortTo = `(...${p.to.slice(-4)})`;
      const fromIdent = p.fromName ? ansiYellow(`${p.fromName} ${shortFrom}`) : ansiYellow(p.from);
      const toIdent = p.toName ? ansiYellow(`${p.toName} ${shortTo}`) : ansiYellow(p.to);
      logger.info(`${fromIdent} to: ${toIdent} amount: ETH ${ethers.formatEther(p.amount)}`);
    }

    logger.info(`\nTotal Transfers: ${plan.length}`);
    logger.info(`Total Volume:    ${ethers.formatEther(totalVolume)} ETH`);
  }

  logger.info(formatFooter());
}