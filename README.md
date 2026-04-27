# Wallet Rebalancer ⚖️

A standalone TypeScript CLI tool designed to automatically equalize Ethereum balances across multiple configured keystore wallets. This tool calculates the optimal transfer plan, accounts for gas fees, and executes the rebalancing seamlessly.

## 🚀 Features

- **Automated Rebalancing**: Evaluates balances across multiple addresses and calculates transfers to make them roughly equal.
- **Dry-Run Mode**: Safely preview the transfer plan and network estimations before broadcasting any transactions.
- **Configurable Limits**: Easily limit the maximum number of transactions, maximum/minimum amounts to send per transaction, and custom RPC URLs.
- **Secure Keystore Support**: Uses encrypted standard `.keystore.json` files ensuring your private keys are handled securely.

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xnan-dev/wallet-rebalancer.git
   cd wallet-rebalancer
   ```

2. **Install dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Provide Wallets**
   Create a `wallets/` directory in the root. Place your encrypted `.keystore.json` files in this folder.
   *(Sample keystores are provided inside the `wallets.sample/` directory if you need a reference).*
   
   Optionally, you can add an accompanying `.metadata.json` (e.g. `{"name": "My Wallet"}`) next to the keystore for clear CLI labeling.

4. **Environment Variables**
   Create a `.env` file at the root of the project with your configurations:
   ```env
   # Required
   WALLET_PASSWORD="your-keystore-password"
   
   # Optional configurations (Defaults shown)
   ETHEREUM_RPC_URL="http://127.0.0.1:8545"
   MAX_TX_AMOUNT="20000"
   MIN_TX_AMOUNT="0.0050"
   MAX_TX_RETRIES="5"
   MAX_TRANSACTIONS="20"
   ```

## 🛠️ Usage

To run the project, we use `ts-node` or execute the compiled code directly.

### Development / Direct Execution
You can run the script via CLI arguments manually.

#### Preview Plan (Dry-Run)
Safely review the calculated transfer plan without executing any actual transactions:
```bash
npx ts-node src/index.ts --dry-run
```
*Note: If the projected transfer operations exceed your `MAX_TRANSACTIONS` limit, the CLI will alert you in advance.*

#### Execute Rebalancing
Execute the transfer plan and actively broadcast transactions to the network:
```bash
npx ts-node src/index.ts --execute
```

## 🔐 Security Note
Never commit your `wallets/` folder, actual `.keystore.json` files, or `.env` file containing passwords to version control! They are permanently added to `.gitignore` to prevent any accidental leakage.
