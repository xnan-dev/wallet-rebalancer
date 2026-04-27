#!/bin/bash
# Runs the execution version of the rebalancer

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx src/index.ts --execute
