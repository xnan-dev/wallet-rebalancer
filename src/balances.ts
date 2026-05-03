import { ETHEREUM_RPC_URL } from "./config";
import { ethers } from "ethers";
import { loadWallets } from "./walletLoader";
import { RebalanceResult, WalletBalance, LoadedWallet, ContractConfig } from "./types";
import { logger, formatTitle, formatFooter, ansiYellow } from "./logger";
import { loadContractConfig } from "./contractLoader";
import path from "path";

const CONTRACTS_PATH = path.join(process.cwd(), "ethereum_contracts.json");
export let contractConfig: ContractConfig | null = null;


try {
  contractConfig = loadContractConfig(CONTRACTS_PATH);
} catch (e) {
  logger.warn(`Could not load ethereum_contracts.json: ${e instanceof Error ? e.message : String(e)}`);
}


export async function buildBalances(wallets: LoadedWallet[], provider: ethers.Provider): Promise<WalletBalance[]> {
  const jsonProvider = provider as ethers.JsonRpcProvider;
  
  return await Promise.all(
    wallets.map(async (w) => {
      // 1. Fetch ETH balance
      const hexBalance = await jsonProvider.send("eth_getBalance", [w.address, "latest"]);
      const ethBalance = BigInt(hexBalance);

      // 2. Fetch ERC20 balances if configured
      const assetBalances: Record<string, bigint> = {};
      
      if (contractConfig) {
        for (const [symbol, asset] of Object.entries(contractConfig.assets)) {
          if (asset.type === "erc20" && asset.address) {
            try {
              const contract = new ethers.Contract(
                asset.address,
                ["function balanceOf(address) view returns (uint256)"],
                provider
              );
              const balance = await contract.balanceOf(w.address);
              assetBalances[symbol] = BigInt(balance);
            } catch (err) {
              logger.debug(`Failed to fetch ${symbol} balance for ${w.address}: ${err}`);
              assetBalances[symbol] = 0n;
            }
          }
        }
      }

      return {
        address: w.address,
        name: w.name,
        weight: w.weight,
        balance: ethBalance,
        assetBalances
      };
    })
  );
}


async function getBalances() {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
  const loaded = await loadWallets(provider);
  return await buildBalances(loaded, provider);
}

export function logBalance(b: { address: string; balance: bigint; name?: string }) {
  return {
    address: b.address,
    ...(b.name ? { name: b.name } : {}),
    balance: ethers.formatEther(b.balance)
  };
}

export function logBalances(title: string, balances: WalletBalance[]) {
  logger.info(formatTitle(title));

  const erc20Symbols = contractConfig 
    ? Object.keys(contractConfig.assets).filter(s => contractConfig!.assets[s].type === "erc20")
    : [];

  // Header
  const headers = ["Wallet", "ETH", ...erc20Symbols];
  const headerStr = headers[0].padEnd(24) + headers.slice(1).map(h => h.padEnd(12)).join(" ");
  logger.info(headerStr);
  logger.info("-".repeat(headerStr.length));

  for (const b of balances) {
    const shortAddr = `(...${b.address.slice(-4)})`;
    const ident = b.name ? `${b.name} ${shortAddr}` : b.address;
    
    const row = [
      ident.padEnd(24),
      ethers.formatEther(b.balance).slice(0, 10).padEnd(12)
    ];


    for (const symbol of erc20Symbols) {
      const asset = contractConfig!.assets[symbol];
      const balance = b.assetBalances[symbol] || 0n;
      row.push(ethers.formatUnits(balance, asset.decimals).slice(0, 10).padEnd(12));
    }

    logger.info(row.join(" "));
  }

  logger.info(formatFooter());
}


export function logRebalanceResults(results: MultiAssetRebalanceResult[]) {
  for (const assetResult of results) {
    logger.info(formatTitle(`REBALANCE: ${assetResult.asset}`));
    
    // Header
    const headers = ["Wallet", "Balance", "Target", "Delta", "Action"];
    const headerStr = headers[0].padEnd(24) + headers.slice(1).map(h => h.padEnd(16)).join(" ");
    logger.info(headerStr);
    logger.info("-".repeat(headerStr.length));

    for (const r of assetResult.results) {
      const shortAddr = `(...${r.address.slice(-4)})`;
      const ident = r.name ? `${r.name} ${shortAddr}` : r.address;
      const action = r.delta > 0n ? "RECEIVE" : (r.delta < 0n ? "SEND" : "-");
      const sign = r.delta > 0n ? "+" : (r.delta < 0n ? "-" : "");
      const absDelta = r.delta < 0n ? -r.delta : r.delta;

      const row = [
        ident.padEnd(24),
        ethers.formatUnits(r.balance, assetResult.decimals).slice(0, 12).padEnd(16),
        ethers.formatUnits(r.target, assetResult.decimals).slice(0, 12).padEnd(16),
        (sign + ethers.formatUnits(absDelta, assetResult.decimals)).slice(0, 12).padEnd(16),
        action.padEnd(16)
      ];
      logger.info(row.join(" "));
    }

    logger.info(formatFooter());
    logger.info("");
  }
}


async function main() {
  const balances = await getBalances();
  logBalances("CURRENT BALANCES", balances);
}

if (require.main === module) {
  main().catch(err => logger.error(err));
}