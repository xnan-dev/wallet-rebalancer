import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ethers } from "ethers";
import { rebalance } from "../src/rebalance";
import { buildTransferPlan } from "../src/plan";

describe("Transfer Plan Logic", () => {
  it("should calculate correct transfers to rebalance 10 ETH across 3 wallets", () => {
    const wallets = [
      { address: "w1", balance: ethers.parseEther("10") },
      { address: "w2", balance: ethers.parseEther("0") },
      { address: "w3", balance: ethers.parseEther("0") }
    ];

    const rebalanceResult = rebalance(wallets);
    const plan = buildTransferPlan(rebalanceResult);

    assert.equal(plan.length, 2);

    assert.equal(plan[0].from, "w1");
    assert.equal(plan[0].to, "w2");
    assert.equal(plan[0].amount, 3333333333333333333n);

    assert.equal(plan[1].from, "w1");
    assert.equal(plan[1].to, "w3");
    assert.equal(plan[1].amount, 3333333333333333333n);
  });
});
