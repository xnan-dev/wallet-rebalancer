import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { WALLETS_DIR } from "./config";

import { LoadedWallet, WalletMap } from "./types";

export function buildWalletMap(loadedWallets: LoadedWallet[]): WalletMap {
  const walletMap: WalletMap = {};
  for (const w of loadedWallets) {
    walletMap[w.address] = w.wallet as ethers.Wallet;
  }
  return walletMap;
}

export async function loadWallets(provider: any): Promise<LoadedWallet[]> {
  const password = process.env.WALLET_PASSWORD;

  if (!password) {
    throw new Error("WALLET_PASSWORD not set in env");
  }

  const files = fs.readdirSync(WALLETS_DIR);

  const wallets: LoadedWallet[] = [];

  for (const file of files) {
    if (!file.endsWith(".keystore.json")) continue;

    const baseName = file.replace(".keystore.json", "");
    const keystorePath = path.join(WALLETS_DIR, file);
    const metadataPath = path.join(WALLETS_DIR, `${baseName}.metadata.json`);

    const keystoreContent = fs.readFileSync(keystorePath, "utf-8");
    let name, target;

    if (fs.existsSync(metadataPath)) {
      const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      name = meta.name;
      target = meta.target;
    }

    // 🔐 decrypt
    const wallet = await ethers.Wallet.fromEncryptedJson(
      keystoreContent,
      password
    );

    const connected = wallet.connect(provider);

    wallets.push({
      wallet: connected,
      address: connected.address,
      name,
      target
    });
  }

  return wallets;
}