import { MIN_RESERVE_AMOUNT } from "./config";
import { WalletBalance, RebalanceResult } from "./types";

export function rebalance(
  wallets: WalletBalance[]
): RebalanceResult[] {

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0n);
  const totalWeight = wallets.reduce((acc, w) => acc + BigInt(w.weight), 0n);

  if (totalWeight === 0n) {
    throw new Error("Total weight of wallets cannot be zero");
  }

  // Set aside reserves for every wallet first
  const totalReserves = MIN_RESERVE_AMOUNT * BigInt(wallets.length);
  const distributable = totalBalance > totalReserves ? totalBalance - totalReserves : 0n;

  const results = wallets.map((w) => {
    const weight = BigInt(w.weight);
    
    // Target = Reserve + (Weighted share of remaining balance)
    const target = MIN_RESERVE_AMOUNT + (distributable * weight) / totalWeight;

    return {
      address: w.address,
      name: w.name,
      balance: w.balance,
      target,
      delta: w.balance - target,
      weight: w.weight,
      totalWeight: Number(totalWeight)
    };
  });

  // Distribute leftover wei (remainder from division) to the first wallet
  const currentTotalTarget = results.reduce((acc, r) => acc + r.target, 0n);
  const leftover = totalBalance - currentTotalTarget;
  if (leftover > 0n && results.length > 0) {
    results[0].target += leftover;
    results[0].delta = results[0].balance - results[0].target;
  }

  return results;
}