#!/bin/bash

# Chain Reaction Game Startup Script

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Display ASCII art header
echo "================================================"
echo "          CHAIN REACTION GAME LAUNCHER           "
echo "================================================"
echo

# Check for required tools
echo "Checking requirements..."

# Check for Node.js
if ! command_exists node; then
  echo "Error: Node.js is not installed. Please install Node.js to run this game."
  exit 1
else
  NODE_VERSION=$(node -v)
  echo "✓ Node.js $NODE_VERSION found"
fi

# Check for npm
if ! command_exists npm; then
  echo "Error: npm is not installed. Please install npm to run this game."
  exit 1
else
  NPM_VERSION=$(npm -v)
  echo "✓ npm $NPM_VERSION found"
fi

# Check for Python
if ! command_exists python3; then
  echo "Error: Python 3 is not installed. Please install Python 3 to run this game."
  exit 1
else
  PYTHON_VERSION=$(python3 --version)
  echo "✓ $PYTHON_VERSION found"
fi

echo "All requirements satisfied!"
echo

# Navigate to Frontend directory and install dependencies if needed
echo "Installing game dependencies..."
cd Frontend || { echo "Error: Frontend directory not found."; exit 1; }

if [ ! -d "node_modules" ]; then
  echo "Installing npm packages (this may take a few moments)..."
  npm install
else
  echo "Dependencies already installed."
fi

echo

# Start the game
echo "Starting Chain Reaction game..."
echo "----------------------------------------"
echo "The game will open in your default browser."
echo "If it doesn't open automatically, go to: http://localhost:5173"
echo "----------------------------------------"
echo

# Use the start script which runs both servers concurrently
npm start

# Exit gracefully
echo
echo "Game servers stopped. Thanks for playing!"
