# Contributing to Chain Reaction Game

Thank you for considering contributing to the Chain Reaction Game! This document outlines the process for contributing to this project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Chain-Reaction.git`
3. Install dependencies:
   ```bash
   cd Chain-Reaction
   cd Frontend
   npm install
   ```
4. Run the game using the startup script: `./start-game.sh` or `start-game.bat`

## Making Changes

1. Create a new branch: `git checkout -b feature/my-feature` or `git checkout -b fix/my-fix`
2. Make your changes
3. Test your changes thoroughly
4. Commit with meaningful commit messages
5. Push to your fork
6. Open a pull request

## Project Structure Overview

- **Backend/**: Python game engine and AI logic
  - `bridge_mode.py`: Handles communication with the frontend
  - `improved_chain_reaction.py`: Core game logic and AI implementations
  
- **Frontend/**: React-based user interface
  - `src/components/`: UI components like game board, modals, etc.
  - `src/pages/`: Page components
  - `bridge-server.js`: Node.js server that bridges between React and Python

## Coding Guidelines

- Follow existing code style and conventions
- Write clear, descriptive comments
- For frontend: Follow React best practices
- For backend: Follow Python PEP 8 style guidelines

## Bug Reports

If you find a bug, please create an issue with:
1. A clear description of the bug
2. Steps to reproduce
3. Expected versus actual behavior
4. Screenshots if applicable
5. Your environment (OS, browser, etc.)

## Feature Requests

Feature requests are welcome! Please create an issue describing:
1. The feature you'd like to see
2. Why it would be valuable
3. How it might be implemented (optional)
