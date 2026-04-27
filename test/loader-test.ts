import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ethers } from "ethers";
import { loadWallets } from "../src/walletLoader";
import { ETHEREUM_RPC_URL } from "../src/config";

describe("Wallet Loader", () => {
  it("should securely load split metadata and keystore assets from the filesystem", async () => {
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    const wallets = await loadWallets(provider);

    // Assuming we have the 3 default seeded wallets
    assert.equal(wallets.length, 3);
    
    // Ensure that metadata was successfully mapped and parsed
    for (const w of wallets) {
      assert.ok(w.address);
      assert.ok(w.name?.startsWith("hardhat-wallet"));
    }
  });
});
