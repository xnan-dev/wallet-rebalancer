import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "path";
import { loadContractConfig } from "../src/contractLoader";

describe("Contract Loader", () => {
  it("should correctly load and parse ethereum_contracts.json", () => {
    const configPath = path.join(process.cwd(), "ethereum_contracts.json");
    const config = loadContractConfig(configPath);

    assert.equal(config.network, "ethereum");
    assert.ok(config.assets.ETH);
    assert.ok(config.assets.USDT);
    assert.ok(config.assets.USDC);

    // Verify ETH
    assert.equal(config.assets.ETH.type, "native");
    assert.equal(config.assets.ETH.decimals, 18);

    // Verify USDT
    assert.equal(config.assets.USDT.type, "erc20");
    assert.equal(config.assets.USDT.decimals, 6);
    assert.equal(config.assets.USDT.address, "0xdAC17F958D2ee523a2206206994597C13D831ec7");

    // Verify USDC
    assert.equal(config.assets.USDC.type, "erc20");
    assert.equal(config.assets.USDC.decimals, 6);
    assert.equal(config.assets.USDC.address, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("should throw an error if the file does not exist", () => {
    assert.throws(() => {
      loadContractConfig("non_existent_file.json");
    }, /Contract config file not found/);
  });
});
