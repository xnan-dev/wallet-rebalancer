#!/bin/bash
# Runs the dry-run version of the portfolio rebalancer

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx src/index.ts --dry-run --portfolio-rebalancer
