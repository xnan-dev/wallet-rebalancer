import { MIN_RESERVE_AMOUNT } from "./config";
import { WalletBalance, RebalanceResult, MultiAssetRebalanceResult, ContractConfig, Wei } from "./types";

/**
 * Calculates rebalancing for a single asset.
 * @param wallets List of wallets and their balances for this specific asset.
 * @param minReserve The amount to set aside in each wallet before rebalancing.
 */
export function rebalance(
  wallets: WalletBalance[],
  minReserve: Wei = MIN_RESERVE_AMOUNT
): RebalanceResult[] {

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0n);
  const totalWeight = wallets.reduce((acc, w) => acc + BigInt(w.weight), 0n);

  if (totalWeight === 0n) {
    throw new Error("Total weight of wallets cannot be zero");
  }

  // Set aside reserves for every wallet first
  const totalReserves = minReserve * BigInt(wallets.length);
  const distributable = totalBalance > totalReserves ? totalBalance - totalReserves : 0n;

  const results = wallets.map((w) => {
    const weight = BigInt(w.weight);
    
    // Target = Reserve + (Weighted share of remaining balance)
    const target = minReserve + (distributable * weight) / totalWeight;

    return {
      address: w.address,
      name: w.name,
      balance: w.balance,
      target,
      delta: target - w.balance, // Target > Balance => RECEIVE (+) | Target < Balance => SEND (-)
      weight: w.weight,
      totalWeight: Number(totalWeight)
    };
  });

  // Distribute leftover wei (remainder from division) to the first wallet
  const currentTotalTarget = results.reduce((acc, r) => acc + r.target, 0n);
  const leftover = totalBalance - currentTotalTarget;
  if (leftover > 0n && results.length > 0) {
    results[0].target += leftover;
    results[0].delta = results[0].target - results[0].balance;
  }

  return results;
}

/**
 * Calculates rebalancing for ETH and all configured ERC20 tokens.
 */
export function rebalanceMultiAsset(
  wallets: WalletBalance[],
  contractConfig: ContractConfig | null
): MultiAssetRebalanceResult[] {
  const allResults: MultiAssetRebalanceResult[] = [];

  // 1. Rebalance ETH (Native)
  allResults.push({
    asset: "ETH",
    decimals: 18,
    results: rebalance(wallets, MIN_RESERVE_AMOUNT)
  });

  // 2. Rebalance ERC20s
  if (contractConfig) {
    for (const [symbol, asset] of Object.entries(contractConfig.assets)) {
      if (asset.type === "erc20") {
        const assetWallets = wallets.map(w => ({
          ...w,
          balance: w.assetBalances[symbol] || 0n
        }));
        allResults.push({
          asset: symbol,
          decimals: asset.decimals,
          results: rebalance(assetWallets, 0n) // No reserve for tokens
        });
      }
    }
  }

  return allResults;
}