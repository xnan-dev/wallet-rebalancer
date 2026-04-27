#!/bin/bash
# This script runs the npm build process to bundle the standalone CLI

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

npm run build
