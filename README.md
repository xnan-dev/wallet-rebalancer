# Wallet Rebalancer ⚖️

A TypeScript CLI tool to rebalance ETH across multiple wallets by equalizing their balances.

⚠️ **This tool moves real funds. Use at your own risk. Always run in `--dry-run` before executing.**

---

## 🧠 How it works

* Reads balances from configured wallets
* Computes total balance
* Calculates equal target per wallet (1/N)
* Generates a minimal transfer plan
* Optionally executes transactions

All calculations are performed using integer (`BigInt`) arithmetic to avoid precision issues.

---

## 🚀 Features

* Deterministic ETH rebalancing (equal split)
* Dry-run mode (default)
* Transfer planning before execution
* Configurable transaction limits
* Retry mechanism for failed transactions
* Encrypted keystore wallet support

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/xnan-dev/wallet-rebalancer.git
cd wallet-rebalancer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Provide Wallets

Create a `wallets/` directory and place your `.keystore.json` files inside.

Optional metadata file (same name, `.metadata.json`):

```json
{
  "name": "My Wallet"
}
```

---

### 4. Environment Variables

Create a `.env` file:

```env
# Required
WALLET_PASSWORD="your-keystore-password"

# Optional
ETHEREUM_RPC_URL="http://127.0.0.1:8545"
MAX_TX_AMOUNT="20000"
MIN_TX_AMOUNT="0.005"
MAX_TX_RETRIES="5"
MAX_TRANSACTIONS="20"
```

---

## 🛠️ Usage

### 🔍 Dry Run (default, safe)

```bash
npx ts-node src/index.ts --dry-run
```

Example output:

```
=== REBALANCE SUMMARY ===
Wallets:        3
Total Balance:  30000.00 ETH
Target:         10000.00 ETH

=== CURRENT BALANCES ===
Wallet A   9983.98 ETH   (-16.02)
Wallet B  10016.01 ETH   (+16.01)
Wallet C   9999.99 ETH   (-0.01)

=== TRANSFER PLAN ===
Wallet B → Wallet A   16.01 ETH
Wallet B → Wallet C    0.01 ETH

Total Transfers: 2
```

---

### 🚀 Execute

```bash
npx ts-node src/index.ts --execute
```

Transactions will be broadcast to the network.

---

## 🔐 Security Notes

* Never commit:

  * `wallets/`
  * `.env`

* Always verify:

  * RPC endpoint
  * wallet addresses
  * transfer plan (via dry-run)

* The tool will:

  * Abort if limits are exceeded
  * Retry failed transactions (up to configured max)

---

## 🧪 Testing

You can simulate a rebalance locally:

```bash
npx ts-node src/simulate.ts
```

---

## 🧭 Roadmap

* ERC20 token support (USDC, USDT)
* Weighted allocations (custom targets)
* Multi-chain support

---

## ⚠️ Disclaimer

This software is experimental and provided "as is", without warranties of any kind.

You are solely responsible for any use and any loss of funds.
