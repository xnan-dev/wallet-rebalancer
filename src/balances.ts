import { ETHEREUM_RPC_URL } from "./config";
import { ethers } from "ethers";
import { loadWallets } from "./walletLoader";
import { RebalanceResult, WalletBalance } from "./types";
import { logger, formatTitle, formatFooter, ansiYellow } from "./logger";

export async function buildBalances(wallets: {address: string, name?: string}[], provider: ethers.Provider): Promise<WalletBalance[]> {
  const jsonProvider = provider as ethers.JsonRpcProvider;
  return await Promise.all(
    wallets.map(async (w) => {
      const hexBalance = await jsonProvider.send("eth_getBalance", [w.address, "latest"]);
      return {
        address: w.address,
        name: w.name,
        balance: BigInt(hexBalance)
      };
    })
  );
}

async function getBalances() {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

  const loaded = await loadWallets(provider);

  const results = [];

  for (const w of loaded) {
    const balance = await provider.getBalance(w.address);

    results.push({
      address: w.address,
      name: w.name,
      balance
    });
  }

  return results;
}

export function logBalance(b: { address: string; balance: bigint; name?: string }) {
  return {
    address: b.address,
    ...(b.name ? { name: b.name } : {}),
    balance: ethers.formatEther(b.balance)
  };
}

export function logBalances(title: string, balances: Array<{ address: string; balance: bigint; name?: string }>) {
  logger.info(formatTitle(title));
  let total = 0n;
  for (const b of balances) {
    total += b.balance;
    const shortAddress = `(...${b.address.slice(-4)})`;
    const ident = b.name ? ansiYellow(`${b.name} ${shortAddress}`) : ansiYellow(b.address);
    logger.info(`${ident}: ETH ${ethers.formatEther(b.balance)}`);
  }
  logger.info(`${ansiYellow("total")} : ETH ${ethers.formatEther(total)}`);
  logger.info(formatFooter());
}

export function logRebalanceResults(results: RebalanceResult[]) {
  logger.info(formatTitle("REBALANCE RESULT"));
  for (const r of results) {
    const shortAddress = `(...${r.address.slice(-4)})`;
    const ident = r.name ? ansiYellow(`${r.name} ${shortAddress}`) : ansiYellow(r.address);
    const sign = r.delta >= 0n ? "+" : "";
    logger.info(`${ident}: ETH ${ethers.formatEther(r.balance)} ${sign}${ethers.formatEther(r.delta)}`);
  }
  logger.info(formatFooter());
}

async function main() {
  const balances = await getBalances();
  logBalances("CURRENT BALANCES", balances);
}

if (require.main === module) {
  main().catch(err => logger.error(err));
}