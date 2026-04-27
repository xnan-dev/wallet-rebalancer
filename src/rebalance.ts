import { WalletBalance, RebalanceResult } from "./types";

export function rebalance(
  wallets: WalletBalance[]
): RebalanceResult[] {

  const total = wallets.reduce((acc, w) => acc + w.balance, 0n);

  const n = BigInt(wallets.length);

  const baseTarget = total / n;
  const remainder = total % n;

  return wallets.map((w, i) => {
    // distribute remainder to first wallets (prevents dust)
    const target =
      i < remainder
        ? baseTarget + 1n
        : baseTarget;

    return {
      address: w.address,
      name: w.name,
      balance: w.balance,
      target,
      delta: w.balance - target
    };
  });
}