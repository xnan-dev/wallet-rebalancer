#!/bin/bash
# This script runs all tests (Solidity and NodeJS/TypeScript)

# Ensure we're running from the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

MIN_RESERVE_AMOUNT=0 npx tsx --test "test/**/*.ts"
