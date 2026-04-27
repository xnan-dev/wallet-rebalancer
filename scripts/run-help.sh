#!/bin/bash
# Prints the help command for the rebalancer tool

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx src/index.ts
