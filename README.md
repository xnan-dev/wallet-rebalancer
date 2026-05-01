# Wallet Rebalancer ⚖️

A TypeScript CLI tool to rebalance ETH across multiple wallets using weighted allocations.

⚠️ **This tool moves real funds. Use at your own risk. Always run in `--dry-run` before executing.**

---

## 🧠 How it works

* Reads balances from configured wallets.
* Loads custom weights and names from `wallets.json`.
* Accounts for a **Minimum Reserve** (default ~$20) to ensure wallets are never drained too dry for gas.
* Calculates weighted targets: `Reserve + (Total - Reserves) * (Weight / TotalWeight)`.
* Generates a minimal transfer plan.
* Automatically adjusts transfer amounts to cover gas fees if a wallet is being drained.
* Optionally executes transactions.

All calculations use `BigInt` arithmetic to ensure precision down to the last wei.

---

## 🚀 Features

* **Weighted Allocations**: Distribute funds according to custom ratios (e.g., 70% treasury, 30% operations).
* **Consolidated Config**: Manage all wallet names and weights in one `wallets.json` file.
* **Per-Wallet Passwords**: Support for `.secrets.json` to store different passwords for each address.
* **Safety Buffer**: `MIN_RESERVE_AMOUNT` prevents wallets from being bricked.
* **Dry-run mode**: Preview all actions without broadcasting.
* **Auto-Gas Adjustment**: Transactions shrink automatically if needed to leave enough for gas fees.

---

## ⚙️ Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Wallets

Place your `.keystore.json` files in the `wallets/` directory.

#### Create `wallets.json`
Define names and weights for each address:
```json
{
  "wallets": [
    {
      "address": "0xabc...",
      "name": "Treasury",
      "weight": 70
    },
    {
      "address": "0xdef...",
      "name": "Hot Wallet",
      "weight": 30
    }
  ]
}
```

#### (Optional) Create `.secrets.json`
If your wallets have different passwords:
```json
{
  "0xabc...": "password123",
  "0xdef...": "secure-pass-456"
}
```

---

### 3. Environment Variables

Create a `.env` file:
```env
# Required
WALLET_PASSWORD="global-fallback-password"

# Optional
ETHEREUM_RPC_URL="http://127.0.0.1:8545"
MIN_RESERVE_AMOUNT="0.006" # ~20 USD to keep in every wallet
MAX_TX_AMOUNT="20000"
MIN_TX_AMOUNT="0.005"
MAX_TRANSACTIONS="20"
```

---

## 🛠️ Usage

### 🔍 Dry Run
```bash
npm start -- --dry-run
```

Example output:
```
====== CURRENT BALANCES ======
hardhat-wallet1 (...93BC): ETH 10.0
hardhat-wallet2 (...79C8): ETH 10.0
hardhat-wallet3 (...2266): ETH 10.0
total : ETH 30.0
==============================

====== REBALANCE RESULT ======
hardhat-wallet1 (...93BC): ETH 10.0 +10.99... (70/100) => ETH 20.99...
hardhat-wallet2 (...79C8): ETH 10.0 -3.99...  (20/100) => ETH 6.00...
hardhat-wallet3 (...2266): ETH 10.0 -6.99...  (10/100) => ETH 3.00...
==============================

======= TRANSFER PLAN ========
hardhat-wallet2 (...79C8) to: hardhat-wallet1 (...93BC) amount: ETH 3.99...
hardhat-wallet3 (...2266) to: hardhat-wallet1 (...93BC) amount: ETH 6.99...

Total Transfers: 2
```

### 🚀 Execute
```bash
npm start -- --execute
```

---

## 🔐 Security Notes

* **Ignore sensitive files**: Ensure `.env`, `.secrets.json`, and `wallets.json` are in your `.gitignore`.
* **Verify before execution**: Always check the `--dry-run` output for correctness.

---

## 🧭 Roadmap
* ERC20 token support (USDC, USDT)
* Multi-chain support

---

## ⚠️ Disclaimer

Experimental software. Provided "as is". Use at your own risk.
