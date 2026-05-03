# Wallet Rebalancer ⚖️

A TypeScript CLI tool to rebalance ETH and ERC20 tokens (USDT, USDC) across multiple wallets using weighted allocations.

⚠️ **This tool moves real funds. Use at your own risk. Always run in `--dry-run` before executing.**

---

## 🧠 How it works

* **Multi-Asset Support**: Reads balances for ETH and any ERC20 tokens defined in `ethereum_contracts.json`.
* **Weighted Allocations**: Loads custom weights and names from `wallets.json`.
* **Minimum Reserve**: Accounts for a **Minimum Reserve** (default ~$20) in ETH to ensure wallets are never drained too dry for gas.
* **Smart Calculations**: Calculates weighted targets: `Reserve + (Total - Reserves) * (Weight / TotalWeight)`.
* **Minimal Transfers**: Generates an optimized transfer plan to minimize transactions.
* **Auto-Gas Adjustment**: Automatically shrinks ETH transfer amounts to cover gas fees if a wallet is being drained.
* **Full Precision**: All calculations use `BigInt` arithmetic to ensure precision down to the last wei.

---

## 🚀 Features

* **ERC20 Support**: Simultaneously rebalance ETH, USDT, and USDC.
* **Weighted Distribution**: Distribute funds according to custom ratios (e.g., 70% treasury, 30% operations).
* **Consolidated Config**: Manage all wallet names and weights in one `wallets.json` file.
* **Contract Registry**: Manage token addresses and decimals in `ethereum_contracts.json`.
* **Per-Wallet Passwords**: Support for `.secrets.json` to store different passwords for each address.
* **Safety Buffer**: `MIN_RESERVE_AMOUNT` prevents wallets from being bricked.
* **Dry-run mode**: Preview all actions without broadcasting.

---

## ⚙️ Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Assets & Wallets

#### Define Assets (`ethereum_contracts.json`)
Configure the tokens you want to track and rebalance:
```json
{
  "network": "ethereum",
  "assets": {
    "ETH": { "type": "native", "decimals": 18 },
    "USDT": { "type": "erc20", "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7", "decimals": 6 }
  }
}
```

#### Define Wallets (`wallets.json`)
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
ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
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
```text
========================================================
=                   REBALANCE: ETH                     =
========================================================
Wallet                   Balance          Target           Delta            Action          
--------------------------------------------------------------------------------------------
Treasury (...93BC)       10.0             20.99            +10.99           RECEIVE         
Hot Wallet (...79C8)     10.0             6.00             -4.00            SEND            
Ops Wallet (...2266)     10.0             3.00             -7.00            SEND            
========================================================

========================================================
=                   REBALANCE: USDT                    =
========================================================
Wallet                   Balance          Target           Delta            Action          
--------------------------------------------------------------------------------------------
Treasury (...93BC)       500.0            700.0            +200.0           RECEIVE         
Hot Wallet (...79C8)     300.0            214.28           -85.71           SEND            
Ops Wallet (...2266)     200.0            85.71            -114.28          SEND            
========================================================

======= TRANSFER PLAN (ETH) ========
Hot Wallet to Treasury: 4.00 ETH
Ops Wallet to Treasury: 7.00 ETH

======= TRANSFER PLAN (USDT) =======
Hot Wallet to Treasury: 85.71 USDT
Ops Wallet to Treasury: 114.28 USDT
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

## ⚠️ Disclaimer

Experimental software. Provided "as is". Use at your own risk.
