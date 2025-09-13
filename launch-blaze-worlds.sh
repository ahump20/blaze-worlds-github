#!/bin/bash

# BLAZE WORLDS CHAMPIONSHIP LAUNCHER
# Professional deployment script with optimization flags

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BLAZE WORLDS                           ║"
echo "║             Championship Frontiers Edition                 ║"
echo "║                                                           ║"
echo "║         Powered by Three.js & Simplex Noise              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PORT=${1:-8080}
HOST=${2:-localhost}
GAME_FILE="blaze-worlds-legendary-frontier.html"

# Check if game file exists
if [ ! -f "$GAME_FILE" ]; then
    echo "❌ Error: $GAME_FILE not found!"
    echo "Please ensure the game file is in the current directory."
    exit 1
fi

# Function to check if port is available
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $PORT is already in use!"
        echo "Trying alternate port..."
        PORT=$((PORT + 1))
        check_port
    fi
}

# Check port availability
check_port

echo "🚀 Starting Blaze Worlds server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Server Configuration:"
echo "   • Port: $PORT"
echo "   • Host: $HOST"
echo "   • File: $GAME_FILE"
echo ""
echo "🎮 Game Features:"
echo "   • Infinite procedural world generation"
echo "   • 6 unique biomes with dynamic transitions"
echo "   • Real-time chunk loading/unloading"
echo "   • Mobile & desktop support"
echo "   • Advanced physics simulation"
echo "   • Cave system generation"
echo "   • Dynamic lighting & shadows"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Python HTTP server
if command -v python3 &>/dev/null; then
    echo "🌐 Access the game at: http://$HOST:$PORT/$GAME_FILE"
    echo ""
    echo "📱 Mobile Access:"
    echo "   • Connect to the same network"
    echo "   • Navigate to: http://[YOUR_IP]:$PORT/$GAME_FILE"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    python3 -m http.server $PORT --bind $HOST
elif command -v python &>/dev/null; then
    echo "🌐 Access the game at: http://$HOST:$PORT/$GAME_FILE"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    python -m SimpleHTTPServer $PORT
else
    echo "❌ Error: Python is not installed!"
    echo "Please install Python to run the local server."
    exit 1
fi