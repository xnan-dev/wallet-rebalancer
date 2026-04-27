#!/bin/bash

echo "Starting hardhat node in background..."
cd "$(dirname "$0")/../hardhat" || exit 1
npx hardhat node > hardhat_node.log 2>&1 &
PID=$!
echo "Hardhat node started with PID $PID"
echo "Logs are in hardhat/hardhat_node.log"
