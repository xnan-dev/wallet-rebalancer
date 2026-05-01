#!/bin/bash
# This script compiles the distribution output into standalone OS binaries

# Ensure we're running from the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "Building standalone binaries..."
npx pkg . --out-path bin/ --targets node20-linux-x64,node20-macos-x64,node20-win-x64

echo "Done! Statically compiled OS binaries can be found in the 'bin/' folder."
