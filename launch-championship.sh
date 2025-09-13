#!/usr/bin/env bash

# Blaze Worlds Championship - Quick Launch Script
# The fastest way to experience championship frontiers

set -eo pipefail

# Championship colors
TEXAS_ORANGE='\033[38;5;208m'
CARDINAL_BLUE='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${TEXAS_ORANGE}"
cat << "EOF"
🤠 BLAZE WORLDS CHAMPIONSHIP 🏆
   Quick Launch - Ready in 3...2...1...
EOF
echo -e "${NC}"

# Check if already built
if [ ! -d "./dist" ] || [ ! -f "./dist/launcher.html" ]; then
    echo -e "${CARDINAL_BLUE}🚀 Building championship for first launch...${NC}"
    ./deploy-blaze-worlds-championship.sh local > /dev/null 2>&1
fi

# Launch championship
echo -e "${GREEN}🏆 Launching Texas Championship Experience...${NC}"

if command -v python3 >/dev/null 2>&1; then
    cd dist
    echo -e "${CARDINAL_BLUE}🌟 Championship server starting on http://localhost:8080${NC}"

    # Try to open browser
    sleep 1
    if command -v osascript >/dev/null 2>&1; then
        osascript -e 'open location "http://localhost:8080/launcher.html"' 2>/dev/null || true
    fi

    # Start server
    python3 -m http.server 8080
else
    echo -e "${TEXAS_ORANGE}⚡ Open dist/launcher.html in your browser${NC}"
fi