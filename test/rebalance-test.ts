import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ethers } from "ethers";
import { rebalance } from "../src/rebalance";

describe("Rebalance Logic", () => {
  it("should split balances equally when perfectly divisible", () => {
    const wallets = [
      { address: "0x1", balance: 100n },
      { address: "0x2", balance: 50n },
      { address: "0x3", balance: 0n }
    ];

    const results = rebalance(wallets);

    assert.equal(results.length, 3);
    
    // Total is 150n. Target for each should be 50n.
    assert.equal(results[0].target, 50n);
    assert.equal(results[0].delta, 50n); // 100 - 50
    assert.equal(results[1].target, 50n);
    assert.equal(results[1].delta, 0n);  // 50 - 50
    assert.equal(results[2].target, 50n);
    assert.equal(results[2].delta, -50n); // 0 - 50
  });

  it("should handle remainders by distributing dust to the first wallets", () => {
    const wallets = [
      { address: "0x1", balance: 51n },
      { address: "0x2", balance: 50n },
      { address: "0x3", balance: 50n }
    ];

    const results = rebalance(wallets);
    
    // Total is 151n. Divide by 3 is 50n, remainder 1.
    // First wallet should get Target 51n, the others 50n.
    assert.equal(results[0].target, 51n);
    assert.equal(results[1].target, 50n);
    assert.equal(results[2].target, 50n);
  });

  it("should handle ether scale balances correctly (migrated from standalone script)", () => {
    const wallets = [
      { address: "w1", balance: ethers.parseEther("10") },
      { address: "w2", balance: ethers.parseEther("0") }
    ];

    const results = rebalance(wallets);

    assert.equal(results.length, 2);
    assert.equal(results[0].target, ethers.parseEther("5"));
    assert.equal(results[0].delta, ethers.parseEther("5"));
    assert.equal(results[1].target, ethers.parseEther("5"));
    assert.equal(results[1].delta, ethers.parseEther("-5"));
  });
});
