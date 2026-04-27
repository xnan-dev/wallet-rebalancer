#!/bin/bash
# Runs the dry-run version of the rebalancer

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx src/index.ts --dry-run
