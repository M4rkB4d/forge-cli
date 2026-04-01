#!/bin/bash
# Axios Supply Chain Attack Check (March 31, 2026)
# Run this in any project directory that uses axios
# Usage: bash check-axios-compromise.sh [project-path]

DIR="${1:-.}"

echo "=== Axios Compromise Check ==="
echo "Checking: $(cd "$DIR" && pwd)"
echo ""

# Check 1: Is plain-crypto-js present? (definitive compromise indicator)
if [ -d "$DIR/node_modules/plain-crypto-js" ]; then
  echo "!!! COMPROMISED !!! plain-crypto-js found in node_modules"
  echo "ACTION: This machine must be treated as fully compromised."
  echo "  1. Disconnect from network immediately"
  echo "  2. Do NOT run any more commands"
  echo "  3. Report to security team"
  exit 1
fi

# Check 2: Is it in the lock file?
if [ -f "$DIR/package-lock.json" ]; then
  if grep -q "plain-crypto-js" "$DIR/package-lock.json"; then
    echo "!!! COMPROMISED !!! plain-crypto-js found in package-lock.json"
    exit 1
  fi
fi

# Check 3: What axios version is installed?
if [ -f "$DIR/node_modules/axios/package.json" ]; then
  AXIOS_VER=$(grep '"version"' "$DIR/node_modules/axios/package.json" | head -1 | grep -o '[0-9][0-9.]*')
  echo "Installed axios version: $AXIOS_VER"
  if [ "$AXIOS_VER" = "1.14.1" ] || [ "$AXIOS_VER" = "0.30.4" ]; then
    echo "!!! WARNING !!! Compromised version detected: $AXIOS_VER"
    echo "Run: npm ls plain-crypto-js"
    exit 1
  else
    echo "OK — not a compromised version"
  fi
else
  echo "axios not installed in node_modules (npm install may not have been run)"
fi

# Check 4: What does the lock file say?
if [ -f "$DIR/package-lock.json" ]; then
  LOCK_VER=$(grep -A2 '"axios"' "$DIR/package-lock.json" | grep '"version"' | head -1 | grep -o '[0-9][0-9.]*')
  echo "Lock file axios version: $LOCK_VER"
fi

# Check 5: What does package.json specify?
if [ -f "$DIR/package.json" ]; then
  PKG_VER=$(grep '"axios"' "$DIR/package.json" | grep -o '[^"]*"$' | tr -d '"')
  echo "package.json specifies: $PKG_VER"
fi

echo ""
echo "=== Result: CLEAN (no compromise indicators found) ==="
