import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { rebalance } from "./rebalance";
import { buildTransferPlan, logTransferPlan } from "./plan";
import { executePlan } from "./execute";
import { logBalances, logRebalanceResults, buildBalances } from "./balances";
import { loadWallets, buildWalletMap } from "./walletLoader";

import { ETHEREUM_RPC_URL } from "./config";
import { logger, ansiGreen } from "./logger";

async function main() {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
  const loaded = await loadWallets(provider);

  const wallets = loaded.map(w => w.wallet);
  const addresses = loaded.map(w => w.address);

  let balances = await buildBalances(loaded, provider);
  logBalances("INITIAL BALANCES", balances);

  logger.info(`\n${ansiGreen("simulation")}: creating imbalance`);

  const tx = await wallets[0].sendTransaction({
    to: addresses[1],
    value: ethers.parseEther("2500")
  });

  await tx.wait();

  balances = await buildBalances(loaded, provider);
  logBalances("POST-IMBALANCE BALANCES", balances);

  const rebalanceResult = rebalance(balances);
  logRebalanceResults(rebalanceResult);

  const plan = buildTransferPlan(rebalanceResult);

  const walletMap = buildWalletMap(loaded);
  await executePlan(plan, walletMap, true);

  const finalBalances = await buildBalances(loaded, provider);
  logBalances("FINAL BALANCES", finalBalances);
}

main();