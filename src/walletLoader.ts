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
  const envPassword = process.env.WALLET_PASSWORD;

  // 1. Load Secrets
  let secrets: Record<string, string> = {};
  const secretsPath = path.join(process.cwd(), ".secrets.json");
  if (fs.existsSync(secretsPath)) {
    try {
      const secretsContent = fs.readFileSync(secretsPath, "utf-8");
      const parsedSecrets = JSON.parse(secretsContent);
      for (const [key, val] of Object.entries(parsedSecrets)) {
        secrets[key.toLowerCase()] = val as string;
      }
    } catch (e) {
      console.warn(`Failed to parse .secrets.json:`, e);
    }
  }

  // 2. Load Wallets Config (Weights/Names)
  let walletConfig: Record<string, { name?: string; weight?: number }> = {};
  const configPath = path.join(process.cwd(), "wallets.json");
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, "utf-8");
      const parsedConfig = JSON.parse(configContent);
      if (parsedConfig.wallets && Array.isArray(parsedConfig.wallets)) {
        for (const w of parsedConfig.wallets) {
          walletConfig[w.address.toLowerCase()] = { name: w.name, weight: w.weight };
        }
      }
    } catch (e) {
      console.warn(`Failed to parse wallets.json:`, e);
    }
  }

  const files = fs.readdirSync(WALLETS_DIR);

  const wallets: LoadedWallet[] = [];

  for (const file of files) {
    if (!file.endsWith(".keystore.json")) continue;

    const baseName = file.replace(".keystore.json", "");
    const keystorePath = path.join(WALLETS_DIR, file);

    const keystoreContent = fs.readFileSync(keystorePath, "utf-8");
    const keystoreJson = JSON.parse(keystoreContent);
    const address = keystoreJson.address ? `0x${keystoreJson.address.toLowerCase()}` : baseName.toLowerCase();
    
    const password = secrets[address] || envPassword;

    if (!password) {
      throw new Error(`No password found for wallet ${address}. Set it in .secrets.json or WALLET_PASSWORD in env.`);
    }

    // Get metadata from config
    const config = walletConfig[address.toLowerCase()] || {};
    const name = config.name;
    const weight = config.weight ?? 1;

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
      weight
    });
  }

  return wallets;
}