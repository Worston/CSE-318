// Node.js bridge server for Chain Reaction game
// Handles file I/O and Python backend communication

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const BACKEND_DIR = path.join(__dirname, '..', 'Backend');
const GAME_STATE_FILE = path.join(BACKEND_DIR, 'improved_gamestate.txt');
const PYTHON_SCRIPT = path.join(BACKEND_DIR, 'bridge_mode.py');

let backendProcess = null;
let gameConfig = null; // Store original game configuration
let fileWriteMutex = false; // Prevent concurrent file writes

console.log('Bridge server paths:');
console.log('BACKEND_DIR:', BACKEND_DIR);
console.log('GAME_STATE_FILE:', GAME_STATE_FILE);
console.log('PYTHON_SCRIPT:', PYTHON_SCRIPT);

// API Routes

// Initialize new game
app.post('/api/game/init', async (req, res) => {
  try {
    const config = req.body; // Frontend sends config directly, not nested
    console.log('Initializing NEW game with config:', config);
    
    // CRITICAL: Stop any existing backend process to prevent state carryover
    if (backendProcess) {
      console.log('Stopping existing backend process for new game...');
      backendProcess.kill('SIGTERM');
      backendProcess = null;
      // Give the process time to terminate
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
    }
    
    // Store the original game configuration
    gameConfig = config;
    console.log('Stored new game config:', gameConfig);
    
    // Clear any existing game state file first
    try {
      const tempState = `Game Reset:
LastPlayer: EMPTY
MoveCount: 0
GameOver: false
Winner: None
Board:
(clearing previous state)`;
      await safeWriteFile(GAME_STATE_FILE, tempState);
      console.log('Previous game state cleared');
    } catch (error) {
      console.log('No previous state to clear:', error.message);
    }
    
    // Validate config
    if (!config || !config.rows || !config.cols) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid config: missing rows or cols',
        receivedConfig: config 
      });
    }
    
    // Create initial game state
    const rows = config.rows;
    const cols = config.cols;
    const emptyBoard = Array(rows).fill(null).map(() => 
      '⚫'.repeat(cols).split('')
    ).map(row => row.join(' ')).join('\n');

    const initialState = `Game Start:
LastPlayer: EMPTY
MoveCount: 0
GameOver: false
Winner: None
Board:
${emptyBoard}`;

    await safeWriteFile(GAME_STATE_FILE, initialState);
    console.log('Game state file created');
    
    // Wait a moment to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Pre-warm backend process for faster first move
    await startPythonBackend(config);
    console.log('Backend process pre-warmed for faster first move');
    
    // Give backend time to read the initial state
    await new Promise(resolve => setTimeout(resolve, 200));

    res.json({ success: true, message: 'Game initialized' });
  } catch (error) {
    console.error('Failed to initialize game:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current game state
app.get('/api/game/state', async (req, res) => {
  try {
    const content = await fs.readFile(GAME_STATE_FILE, 'utf8');
    const gameState = parseGameState(content);
    res.json({ success: true, gameState });
  } catch (error) {
    console.error('Failed to read game state:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Make a move
app.post('/api/game/move', async (req, res) => {
  try {
    const { board, row, col, currentPlayer } = req.body;
    console.log(`Processing move: ${currentPlayer} at ${row},${col}`);
    
    // Calculate total orbs on the board for validation
    let totalOrbs = 0;
    for (const boardRow of board) {
      for (const cell of boardRow) {
        totalOrbs += cell.orbs;
      }
    }
    
    console.log(`Current total orbs on board: ${totalOrbs}`);
    
    // For human vs human mode, we need to process moves through the Python backend
    // to handle explosions and game logic properly
    
    // First, convert the frontend board to the backend format and write to file
    const boardStr = board.map(boardRow => 
      boardRow.map(cell => {
        if (cell.player === 'EMPTY') return '⚫';
        if (cell.player === 'RED') return `🔴${cell.orbs}`;
        if (cell.player === 'BLUE') return `🔵${cell.orbs}`;
      }).join(' ')
    ).join('\n');

    const gameStateContent = `Human Move Request:
Player: ${currentPlayer}
Row: ${row}
Col: ${col}
LastPlayer: ${totalOrbs === 0 ? 'EMPTY' : (currentPlayer === 'RED' ? 'BLUE' : 'RED')}
MoveCount: ${totalOrbs}
GameOver: false
Winner: None
Board:
${boardStr}`;

    await safeWriteFile(GAME_STATE_FILE, gameStateContent);
    console.log('Move written to game state file for processing');
    
    // Start Python backend if not already running
    if (!backendProcess) {
      console.log('Starting Python backend for move processing...');
      // Use stored game configuration instead of inferring from board
      const configToUse = gameConfig || {
        mode: 'USER_VS_USER',
        rows: board.length,
        cols: board[0].length
      };
      console.log('Using game config for backend:', configToUse);
      await startPythonBackend(configToUse);
      
      // Reduced wait time since backend is pre-warmed during initialization
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Verify that the backend process is still alive and responsive
      if (backendProcess.killed || !backendProcess.pid) {
        console.log('Backend process is dead, restarting...');
        backendProcess = null;
        const configToUse = gameConfig || {
          mode: 'USER_VS_USER',
          rows: board.length,
          cols: board[0].length
        };
        await startPythonBackend(configToUse);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Signal Python backend to process the human move
    if (backendProcess && backendProcess.stdin) {
      backendProcess.stdin.write('process_move\n');
      console.log('Sent process_move command to backend');
    } else {
      console.log('Backend process not available, returning move as-is');
      return res.json({ success: true, message: 'Move recorded (no backend processing)' });
    }

    // Wait for backend to process the move and update the file
    let attempts = 0;
    const maxAttempts = 40; // Increased attempts but shorter delays
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 250ms to 100ms
      
      try {
        const updatedContent = await fs.readFile(GAME_STATE_FILE, 'utf8');
        
        // Check if the content changed from our input (backend processed it)
        if (updatedContent !== gameStateContent && 
            (updatedContent.includes('Move Processed') ||
             updatedContent.includes('Game Over') ||
             updatedContent.includes('LastPlayer:') && !updatedContent.includes('Human Move Request:'))) {
          
          console.log('Move processed by backend');
          const updatedState = parseGameState(updatedContent);
          return res.json({ success: true, gameState: updatedState });
        }
      } catch (error) {
        console.error('Error reading updated game state:', error);
      }
      
      attempts++;
      
      // Log progress every 20 attempts (reduced frequency)
      if (attempts % 20 === 0) {
        console.log(`Waiting for backend processing... attempt ${attempts}/${maxAttempts}`);
      }
    }

    // Fallback: return the original state if backend doesn't respond
    console.log('Backend processing timeout, returning original state');
    res.json({ success: true, message: 'Move recorded (backend timeout)' });
    
  } catch (error) {
    console.error('Failed to record move:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI move endpoint for Human vs AI mode
app.post('/api/game/ai-move', async (req, res) => {
  try {
    const { player } = req.body;
    console.log(`Processing AI move for player: ${player}`);
    
    // Ensure we have a game configuration
    if (!gameConfig) {
      return res.status(400).json({ 
        success: false, 
        error: 'No game configuration found. Please initialize game first.' 
      });
    }
    
    // Verify this is a Human vs AI or AI vs AI game
    if (gameConfig.mode !== 'USER_VS_AI' && gameConfig.mode !== 'User vs AI' && 
        gameConfig.mode !== 'AI_VS_AI' && gameConfig.mode !== 'AI vs AI') {
      return res.status(400).json({ 
        success: false, 
        error: 'AI moves are only allowed in Human vs AI or AI vs AI mode' 
      });
    }
    
    // Read current game state
    const currentContent = await fs.readFile(GAME_STATE_FILE, 'utf8');
    const currentGameState = parseGameState(currentContent);
    
    // For AI vs AI mode, allow any AI player to move if it's their turn
    // For Human vs AI mode, verify it's actually the AI's turn
    if (gameConfig.mode === 'USER_VS_AI' || gameConfig.mode === 'User vs AI') {
      const expectedAIPlayer = (gameConfig.firstPlayer === 'AI') ? 'RED' : 'BLUE';
      if (currentGameState.currentPlayer !== expectedAIPlayer) {
        return res.status(400).json({ 
          success: false, 
          error: `It's not the AI's turn. Current player: ${currentGameState.currentPlayer}` 
        });
      }
    } else if (gameConfig.mode === 'AI_VS_AI' || gameConfig.mode === 'AI vs AI') {
      // In AI vs AI mode, verify the requested player matches the current player
      if (currentGameState.currentPlayer !== player) {
        return res.status(400).json({ 
          success: false, 
          error: `It's not ${player}'s turn. Current player: ${currentGameState.currentPlayer}` 
        });
      }
    }
    
    // Check if game is already over
    if (currentGameState.gameOver) {
      return res.status(400).json({ 
        success: false, 
        error: 'Game is already over' 
      });
    }
    
    // Start backend if not running
    if (!backendProcess || backendProcess.killed) {
      console.log('Starting backend for AI move...');
      await startPythonBackend(gameConfig);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Request AI move from backend
    const aiMoveRequest = `AI_MOVE_REQUEST:${player}\n`;
    
    // Write the AI move request to the game state file
    await safeWriteFile(GAME_STATE_FILE, currentContent + '\n' + aiMoveRequest.trim());
    
    // Signal Python backend to process the AI move
    if (backendProcess && backendProcess.stdin) {
      backendProcess.stdin.write('process_ai_move\n');
      console.log('Sent process_ai_move command to backend');
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Backend process not available' 
      });
    }
    
    // Wait for backend to process the AI move
    let attempts = 0;
    const maxAttempts = 50; // Allow more time for AI thinking
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms intervals
      attempts++;
      
      try {
        const updatedContent = await fs.readFile(GAME_STATE_FILE, 'utf8');
        
        // Check if the AI has made a move (content changed and no AI_MOVE_REQUEST)
        if (updatedContent !== currentContent && 
            !updatedContent.includes('AI_MOVE_REQUEST') &&
            (updatedContent.includes('AI Move') || 
             updatedContent.includes('Game Over') ||
             updatedContent.includes('Smart AI Move') ||
             updatedContent.includes('Random AI Move'))) {
          
          console.log('AI move completed successfully');
          const finalGameState = parseGameState(updatedContent);
          
          return res.json({ 
            success: true, 
            message: 'AI move completed',
            gameState: finalGameState
          });
        }
      } catch (error) {
        console.error('Error reading updated game state:', error);
      }
    }
    
    // Timeout - try using the fallback random AI logic
    console.log('AI move timeout - using fallback random AI logic');
    
    try {
      const fallbackContent = await fs.readFile(GAME_STATE_FILE, 'utf8');
      const fallbackGameState = parseGameState(fallbackContent);
      
      // Use bridge server's random AI as fallback
      if (gameConfig.aiType === 'RANDOM') {
        const randomMove = generateRandomMove(fallbackGameState);
        if (randomMove) {
          console.log(`Fallback random AI move: ${randomMove.row}, ${randomMove.col}`);
          return res.json({
            success: true,
            message: 'AI move completed (fallback)',
            gameState: fallbackGameState,
            aiMove: randomMove
          });
        }
      }
      
      return res.status(408).json({ 
        success: false, 
        error: 'AI move timeout. Please try again.' 
      });
    } catch (fallbackError) {
      console.error('Fallback AI move failed:', fallbackError);
      return res.status(408).json({ 
        success: false, 
        error: 'AI move timeout. Please try again.' 
      });
    }
    
  } catch (error) {
    console.error('Failed to process AI move:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop backend process
app.post('/api/game/stop', async (req, res) => {
  try {
    if (backendProcess) {
      console.log('Stopping backend process...');
      backendProcess.kill('SIGTERM');
      backendProcess = null;
      // Wait for process to terminate
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clear stored game configuration
    gameConfig = null;
    console.log('Game configuration cleared');
    
    res.json({ success: true, message: 'Backend stopped and game state cleared' });
  } catch (error) {
    console.error('Failed to stop backend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset game state (for new games)
app.post('/api/game/reset', async (req, res) => {
  try {
    console.log('Resetting game state...');
    
    // Stop existing backend process
    if (backendProcess) {
      console.log('Killing existing backend process for reset...');
      backendProcess.kill('SIGTERM');
      backendProcess = null;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clear stored configuration
    gameConfig = null;
    
    // Clear game state file
    const emptyState = `Game Reset:
LastPlayer: EMPTY
MoveCount: 0
GameOver: false
Winner: None
Board:
(will be initialized with new game)`;
    
    await safeWriteFile(GAME_STATE_FILE, emptyState);
    console.log('Game state file cleared');
    
    res.json({ success: true, message: 'Game reset successfully' });
  } catch (error) {
    console.error('Failed to reset game:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper Functions

// Thread-safe file writing to prevent glitches
async function safeWriteFile(filePath, content) {
  while (fileWriteMutex) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  fileWriteMutex = true;
  try {
    await fs.writeFile(filePath, content);
  } finally {
    fileWriteMutex = false;
  }
}

async function startPythonBackend(config) {
  try {
    // Convert frontend mode names to backend format
    let backendMode = config.mode;
    if (config.mode === 'USER_VS_AI') {
      backendMode = 'User vs AI';
    } else if (config.mode === 'AI_VS_AI') {
      backendMode = 'AI vs AI';
    } else if (config.mode === 'USER_VS_USER') {
      backendMode = 'User vs User';
    }

    // Convert AI type names
    let backendAiType = config.aiType;
    if (config.aiType === 'MINIMAX') {
      backendAiType = 'Smart';
    } else if (config.aiType === 'RANDOM') {
      backendAiType = 'Random';
    }

    // Convert firstPlayer names
    let backendFirstPlayer = config.firstPlayer;
    if (config.firstPlayer === 'HUMAN') {
      backendFirstPlayer = 'Human';
    } else if (config.firstPlayer === 'AI') {
      backendFirstPlayer = 'AI';
    }

    // Convert difficulty names
    let backendDifficulty = config.difficulty;
    if (config.difficulty === 'EASY') {
      backendDifficulty = 'Easy';
    } else if (config.difficulty === 'MEDIUM') {
      backendDifficulty = 'Medium';
    } else if (config.difficulty === 'HARD') {
      backendDifficulty = 'Hard';
    }

    // Create a config file for the Python backend
    let configContent;
    
    if (config.mode === 'AI_VS_AI' && config.redAI && config.blueAI) {
      // Handle AI vs AI mode with individual AI configurations
      configContent = JSON.stringify({
        rows: config.rows,
        cols: config.cols,
        mode: backendMode,
        redAI: config.redAI.type === 'MINIMAX' ? 
          {
            type: 'Smart',
            difficulty: config.redAI.difficulty === 'EASY' ? 'Easy' : 
                        config.redAI.difficulty === 'MEDIUM' ? 'Medium' : 
                        config.redAI.difficulty === 'HARD' ? 'Hard' : 'Medium',
            heuristic: config.redAI.heuristic || 'combined_v2'
          } : 
          {
            type: 'Random'
          },
        blueAI: config.blueAI.type === 'MINIMAX' ? 
          {
            type: 'Smart',
            difficulty: config.blueAI.difficulty === 'EASY' ? 'Easy' : 
                        config.blueAI.difficulty === 'MEDIUM' ? 'Medium' : 
                        config.blueAI.difficulty === 'HARD' ? 'Hard' : 'Medium',
            heuristic: config.blueAI.heuristic || 'orb_count'
          } : 
          {
            type: 'Random'
          },
        firstPlayer: 'Red' // Always start with Red in AI vs AI
      });
    } else {
      // Handle single AI configuration for other modes
      if (backendAiType === 'Random') {
        // For Random AI, don't include difficulty or heuristic
        configContent = JSON.stringify({
          rows: config.rows,
          cols: config.cols,
          mode: backendMode,
          aiType: 'Random',
          firstPlayer: backendFirstPlayer || 'Human'
        });
      } else {
        // For Smart AI, include difficulty and heuristic
        configContent = JSON.stringify({
          rows: config.rows,
          cols: config.cols,
          mode: backendMode,
          aiType: backendAiType || 'Smart',
          difficulty: backendDifficulty || 'Medium',
          firstPlayer: backendFirstPlayer || 'Human',
          heuristic: config.heuristic || 'combined_v2'
        });
      }
    }
    
    const configPath = path.join(BACKEND_DIR, 'backend_config.json');
    await fs.writeFile(configPath, configContent);
    console.log('Backend config written to:', configPath);

    // Check if Python script exists
    try {
      await fs.access(PYTHON_SCRIPT);
      console.log('Python script found:', PYTHON_SCRIPT);
    } catch {
      console.error('Python script not found:', PYTHON_SCRIPT);
      return;
    }

    // Start Python process
    backendProcess = spawn('python3', [PYTHON_SCRIPT, '--bridge-mode'], {
      cwd: BACKEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend process:', error);
      backendProcess = null;
    });

    console.log('Python backend started with PID:', backendProcess.pid);
  } catch (error) {
    console.error('Failed to start Python backend:', error);
  }
}

function parseGameState(content) {
  const lines = content.split('\n');
  const gameState = {
    lastPlayer: null,
    moveCount: 0,
    gameOver: false,
    winner: null,
    board: [],
    currentPlayer: null
  };

  let boardStartIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('LastPlayer:')) {
      gameState.lastPlayer = line.split(': ')[1].toUpperCase();
    } else if (line.startsWith('MoveCount:')) {
      gameState.moveCount = parseInt(line.split(': ')[1]);
    } else if (line.startsWith('GameOver:')) {
      gameState.gameOver = line.split(': ')[1].toLowerCase() === 'true';
    } else if (line.startsWith('Winner:')) {
      const winner = line.split(': ')[1];
      gameState.winner = winner !== 'None' ? winner.toUpperCase() : null;
    } else if (line.startsWith('Board:')) {
      boardStartIdx = i + 1;
      break;
    }
  }

  // Parse board data
  for (let i = boardStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(' ');
    const row = [];
    
    for (const cellStr of cells) {
      if (cellStr === '⚫') {
        row.push({ orbs: 0, player: 'EMPTY' });
      } else if (cellStr.startsWith('🔴')) {
        const orbStr = cellStr.substring(2); // Skip the emoji (🔴 is 2 characters)
        const orbs = orbStr ? parseInt(orbStr) : 1;
        row.push({ orbs, player: 'RED' });
      } else if (cellStr.startsWith('🔵')) {
        const orbStr = cellStr.substring(2); // Skip the emoji (🔵 is 2 characters) 
        const orbs = orbStr ? parseInt(orbStr) : 1;
        row.push({ orbs, player: 'BLUE' });
      }
    }
    if (row.length > 0) {
      gameState.board.push(row);
    }
  }

  // Determine current player
  if (!gameState.gameOver) {
    if (gameState.lastPlayer === 'EMPTY') {
      gameState.currentPlayer = 'RED'; // First move is always RED
    } else {
      // Since lastPlayer is now normalized to uppercase
      gameState.currentPlayer = gameState.lastPlayer === 'RED' ? 'BLUE' : 'RED';
    }
  }

  // Calculate scores (total orbs for each player)
  gameState.scores = { RED: 0, BLUE: 0 };
  for (const row of gameState.board) {
    for (const cell of row) {
      if (cell.player === 'RED') {
        gameState.scores.RED += cell.orbs;
      } else if (cell.player === 'BLUE') {
        gameState.scores.BLUE += cell.orbs;
      }
    }
  }

  return gameState;
}

function generateRandomMove(gameState) {
  const validMoves = [];
  const currentPlayer = gameState.currentPlayer;
  
  for (let row = 0; row < gameState.board.length; row++) {
    for (let col = 0; col < gameState.board[row].length; col++) {
      const cell = gameState.board[row][col];
      if (cell.player === 'EMPTY' || cell.player === currentPlayer) {
        validMoves.push({ row, col });
      }
    }
  }

  if (validMoves.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

// Start server
app.listen(PORT, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`);
  console.log('Ready to handle Chain Reaction game requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  if (backendProcess) {
    backendProcess.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  if (backendProcess) {
    backendProcess.kill();
  }
  process.exit(0);
});
