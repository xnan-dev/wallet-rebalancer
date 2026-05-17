import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { rebalanceMultiAsset } from "./rebalance";
import { buildMultiAssetTransferPlan, logTransferPlan } from "./plan";
import { executePlan } from "./execute";

import { logBalances, logRebalanceResults, buildBalances, contractConfig } from "./balances";
import { loadWallets, buildWalletMap } from "./walletLoader";

import { ETHEREUM_RPC_URL } from "./config";
import { logger, formatTitle } from "./logger";
import { runSafetyChecks } from "./safety";
import { LoadedWallet } from "./types";

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isDryRun = args.includes("--dry-run");
  const isPortfolio = args.includes("--portfolio-rebalancer");

  if (!isExecute && !isDryRun) {
    logger.info("Wallet Rebalancer Tool");
    logger.info("Goal: Rebalance balances closely to equality across configured wallets.");
    logger.info("\nUsage:");
    logger.info("  --dry-run   : View the calculated transfer plan without sending any transactions.");
    logger.info("  --execute   : Execute the transfer plan and broadcast transactions.");
    logger.info("  --portfolio-rebalancer : Run in portfolio rebalancer mode.");
    logger.info("\nConfiguration (.env):");
    logger.info("  WALLET_PASSWORD  : Password to decrypt keystore files (required)");
    logger.info("  ETHEREUM_RPC_URL : RPC node endpoint (default: http://127.0.0.1:8545)");
    logger.info("  MAX_TX_AMOUNT    : The max ETH you allow per transaction (default: 20000)");
    logger.info("  MIN_TX_AMOUNT    : The minimum threshold ETH to transfer (default: 0.0050)");
    logger.info("  MAX_TRANSACTIONS : The max number of transactions allowed (default: 20)");
    logger.info("  WALLETS_DIR      : Path to loaded wallets (default: ./wallets)");
    logger.info("\nWallets Folder:");
    logger.info("  Place your .keystore.json files inside the targeted WALLETS_DIR.");
    logger.info("  (Optional) Add a matching .metadata.json file with {\"name\": \"My Wallet\"} for labeling.");
    process.exit(0);
  }

  if (isPortfolio) {
    logger.info(formatTitle("STARTING PORTFOLIO REBALANCER"));
  } else {
    logger.info(formatTitle("STARTING WALLET REBALANCER"));
  }
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

  const loaded = await loadWallets(provider);
  if (isPortfolio) {
    await portfolioRebalance(provider, loaded, isExecute, isDryRun);
  } else {
    await walletRebalance(provider, loaded, isExecute, isDryRun);
  }
}

async function portfolioRebalance(provider: ethers.JsonRpcProvider, loaded: LoadedWallet[], isExecute: boolean, isDryRun: boolean) {
  logger.info("Portfolio rebalancing not fully implemented yet.");
}

async function walletRebalance(provider: ethers.JsonRpcProvider, loaded: LoadedWallet[], isExecute: boolean, isDryRun: boolean) {
  const addresses = loaded.map(w => w.address);

  // 1. Gather current balances
  const balances = await buildBalances(loaded, provider);
  logBalances("CURRENT BALANCES", balances);

  // 2. Calculate the rebalance operations needed (ETH + ERC20s)
  const rebalanceResults = rebalanceMultiAsset(balances, contractConfig);
  logRebalanceResults(rebalanceResults);

  // 3. Plan the transactions (Multi-Asset)
  const plan = buildMultiAssetTransferPlan(rebalanceResults, contractConfig);


  // Safety checks (Currently ETH only)

  const ethResults = rebalanceResults.find(r => r.asset === "ETH")?.results || [];
  const ethPlan = plan.filter(p => p.asset === "ETH");
  runSafetyChecks(balances, ethResults, ethPlan);


  // 4. Execute the plan
  const walletMap = buildWalletMap(loaded);
  await executePlan(plan, walletMap, isExecute);

  // 5. Final check
  const finalBalances = await buildBalances(loaded, provider);
  logBalances("FINAL BALANCES", finalBalances);
  
  logger.info(formatTitle("REBALANCER FINISHED"));
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
