#!/bin/bash
# This script runs the Rebalance unit test standalone

# Ensure we're running from the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npx tsx --test test/rebalance-test.ts
