#!/bin/bash
# This script runs the balances process

# Ensure we're running from the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx src/balances.ts
