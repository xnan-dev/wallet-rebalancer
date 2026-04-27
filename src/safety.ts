import { formatTitle, formatFooter, logger, ansiRed, ansiGreen } from "./logger";
import { WalletBalance, RebalanceResult, Transfer } from "./types";
import { MAX_TX_AMOUNT } from "./config";

export function runSafetyChecks(balances: WalletBalance[], results: RebalanceResult[], transfers: Transfer[]) {
  logger.info(formatTitle("SAFETY CHECKS"));

  let failed = false;

  // 1. Sum(delta) == 0
  const sumDelta = results.reduce((acc, r) => acc + r.delta, 0n);
  if (sumDelta === 0n) {
    logger.info(` ✔ Sum(delta) == 0`);
  } else {
    logger.info(` ${ansiRed("✖")} Sum(delta) == 0 (Actual: ${sumDelta})`);
    failed = true;
  }

  // 2. No self-transfers
  const selfTransfers = transfers.filter(t => t.from === t.to);
  if (selfTransfers.length === 0) {
    logger.info(` ✔ No self-transfers`);
  } else {
    logger.info(` ${ansiRed("✖")} No self-transfers (${selfTransfers.length} found)`);
    failed = true;
  }

  // 3. All wallets have sufficient balance
  let sufficientBalance = true;
  const sentByWallet: Record<string, bigint> = {};
  for (const t of transfers) {
    sentByWallet[t.from] = (sentByWallet[t.from] || 0n) + t.amount;
  }
  for (const b of balances) {
    const sentCount = sentByWallet[b.address] || 0n;
    if (b.balance < sentCount) {
      sufficientBalance = false;
      break;
    }
  }
  if (sufficientBalance) {
    logger.info(` ✔ All wallets have sufficient balance`);
  } else {
    logger.info(` ${ansiRed("✖")} All wallets have sufficient balance`);
    failed = true;
  }

  // 4. Max transfer constraint: OK
  const maxViolations = transfers.filter(t => t.amount > MAX_TX_AMOUNT);
  if (maxViolations.length === 0) {
    logger.info(` ✔ Max transfer constraint: OK `);
  } else {
    logger.info(` ${ansiRed("✖")} Max transfer constraint: FAILED (${maxViolations.length} exceeded)`);
    failed = true;
  }
  
  logger.info(formatFooter());

  if (failed) {
    logger.info(ansiRed("Safety checks failed! Aborting execution."));
    process.exit(1);
  }
}
