import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { WALLETS_DIR } from "./config";
import { logger } from "./logger";

const PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
];

const PASSWORD = "test123"; // move to .env later

async function main() {
  for (const pk of PRIVATE_KEYS) {
    const wallet = new ethers.Wallet(pk);

    const encrypted = await wallet.encrypt(PASSWORD);

    const metaData = {
      name: "hardhat-wallet",
      address: wallet.address
    };

    fs.writeFileSync(
      path.join(WALLETS_DIR, `${wallet.address}.metadata.json`),
      JSON.stringify(metaData, null, 2)
    );

    fs.writeFileSync(
      path.join(WALLETS_DIR, `${wallet.address}.keystore.json`),
      encrypted
    );

    logger.info(`Saved ${wallet.address}`);
  }
}

main();