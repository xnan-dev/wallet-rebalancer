import { ethers } from "ethers";
import { logger } from "./logger";

import { ETHEREUM_RPC_URL } from "./config";

async function main() {
  const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

  // 🔑 sender (must have funds)
  const sender = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  // 🎯 receiver
  const to = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

  // 💸 send 1 ETH
  const tx = await sender.sendTransaction({
    to,
    value: ethers.parseEther("3000")
  });

  logger.info("TX HASH: " + tx.hash);

  await tx.wait();

  logger.info("✅ Transaction confirmed");
}

main();