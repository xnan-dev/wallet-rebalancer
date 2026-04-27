# Architecture

## High-Level Design

This directory covers the architectural decisions and system design for the Wallet Rebalancer.

- **Framework:** Node.js, Hardhat 3 Beta natively executing TypeScript/Solidity tests.
- **Smart Contracts:** Solidity contracts meant to hold funds, execute swap logic, or authorize automated rebalancing keepers.
- **Client/Interaction:** Uses `viem` to broadcast transactions to Evm-compatible networks.

### Components

1. **Rebalancer Logic (Off-chain/On-chain)**
   - Calculates the net difference between current allocation and target allocation.
2. **Execution Engine**
   - Dispatches orders safely using DEX aggregators (e.g., 1inch, Uniswap) to minimize slippage.
3. **Configuration / Target State**
   - The user defines parameters (e.g., maintain 50% ETH, 50% USDC).

*(Note: These details are provisional and should be refined based on specific product requirements.)*
