import { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RotateCcw, Info, Crown, Play, Pause, Brain, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import GameBoard from '../components/GameBoard';
import GameStatus from '../components/GameStatus';
import PlayerInfo from '../components/PlayerInfo';
import ScoreBoard from '../components/ScoreBoard';

const GamePage = ({ config, onGoHome, onShowConfigModal }) => {
  console.log('GamePage: Component rendered with config:', config);
  
  const [gameState, setGameState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('RED');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0); // Add reset trigger state
  
  // AI vs AI mode states
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [lastAIMoveTime, setLastAIMoveTime] = useState(0);
  
  // Game initialization ref
  const gameInitializedRef = useRef(false);
  const configHashRef = useRef('');

  // Generate a hash for config to detect actual changes
  const getConfigHash = (cfg) => {
    if (!cfg) return '';
    
    // Include gameSessionId to ensure each new game gets a unique hash
    const sessionId = cfg.gameSessionId || '';
    
    if (cfg.mode === 'AI_VS_AI' && cfg.redAI && cfg.blueAI) {
      return `${cfg.rows}-${cfg.cols}-${cfg.mode}-${cfg.redAI.type}-${cfg.redAI.difficulty}-${cfg.redAI.heuristic}-${cfg.blueAI.type}-${cfg.blueAI.difficulty}-${cfg.blueAI.heuristic}-${cfg.firstPlayer}-${sessionId}`;
    }
    return `${cfg.rows}-${cfg.cols}-${cfg.mode}-${cfg.aiType}-${cfg.difficulty}-${cfg.firstPlayer}-${cfg.heuristic}-${sessionId}`;
  };

  // Handle AI move in Human vs AI mode
  const makeAIMove = useCallback(async () => {
    console.log('GamePage: Making AI move...');
    setIsAIThinking(true);
    
    try {
      const expectedAIPlayer = config.firstPlayer === 'AI' ? 'RED' : 'BLUE';
      
      const response = await fetch('http://localhost:3001/api/game/ai-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: expectedAIPlayer
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.gameState) {
        console.log('GamePage: AI move completed successfully');
        
        // Update game state with AI move result
        setGameState(prevState => ({
          ...prevState,
          board: result.gameState.board,
          scores: result.gameState.scores
        }));
        setMoveCount(result.gameState.moveCount);
        setCurrentPlayer(result.gameState.currentPlayer);
        
        // Check for game over
        if (result.gameState.gameOver) {
          setIsGameOver(true);
          setWinner(result.gameState.winner);
        }
      } else {
        console.error('GamePage: AI move failed:', result.error);
        // Continue with game even if AI move fails
      }
    } catch (error) {
      console.error('GamePage: Failed to get AI move:', error);
    } finally {
      setIsAIThinking(false);
    }
  }, [config]);

  // Handle specific AI move for AI vs AI mode
  const makeSpecificAIMove = useCallback(async (aiPlayer) => {
    if (isGameOver || currentPlayer !== aiPlayer) {
      console.log(`GamePage: Cannot make ${aiPlayer} move - wrong turn or game over`);
      return;
    }
    
    console.log(`GamePage: Making ${aiPlayer} AI move...`);
    setIsAIThinking(true);
    const moveStartTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:3001/api/game/ai-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: aiPlayer
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.gameState) {
        console.log(`GamePage: ${aiPlayer} AI move completed successfully`);
        
        // Update game state with AI move result
        setGameState(prevState => ({
          ...prevState,
          board: result.gameState.board,
          scores: result.gameState.scores
        }));
        setMoveCount(result.gameState.moveCount);
        setCurrentPlayer(result.gameState.currentPlayer);
        setLastAIMoveTime(Date.now() - moveStartTime);
        
        // Check for game over
        if (result.gameState.gameOver) {
          setIsGameOver(true);
          setWinner(result.gameState.winner);
          setIsAutoplay(false); // Stop autoplay when game ends
        }
      } else {
        console.error(`GamePage: ${aiPlayer} AI move failed:`, result.error);
      }
    } catch (error) {
      console.error(`GamePage: Failed to get ${aiPlayer} AI move:`, error);
    } finally {
      setIsAIThinking(false);
    }
  }, [currentPlayer, isGameOver]);

  // Toggle autoplay for AI vs AI mode
  const toggleAutoplay = useCallback(() => {
    if (config.mode !== 'AI_VS_AI') return;
    
    setIsAutoplay(prev => {
      const newAutoplay = !prev;
      
      if (newAutoplay && !isGameOver) {
        console.log('GamePage: Starting autoplay...');
        // Start autoplay with initial move
        if (!isAIThinking) {
          makeSpecificAIMove(currentPlayer);
        }
      } else {
        console.log('GamePage: Stopping autoplay...');
      }
      
      return newAutoplay;
    });
  }, [config.mode, isGameOver, isAIThinking, currentPlayer, makeSpecificAIMove]);

  // Autoplay effect for AI vs AI mode
  useEffect(() => {
    if (config.mode === 'AI_VS_AI' && isAutoplay && !isGameOver && !isAIThinking) {
      // Calculate dynamic delay based on last move time and difficulty
      let baseDelay = 1000; // Base 1 second delay
      
      // Reduce delay if AI took a long time (high difficulty)
      if (lastAIMoveTime > 2000) {
        baseDelay = 500; // Shorter delay for slow AI
      } else if (lastAIMoveTime > 1000) {
        baseDelay = 750;
      }
      
      // Add some visual breathing room
      const visualDelay = Math.max(300, baseDelay);
      
      const timeoutId = setTimeout(() => {
        if (isAutoplay && !isGameOver && !isAIThinking) {
          makeSpecificAIMove(currentPlayer);
        }
      }, visualDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [config.mode, isAutoplay, isGameOver, isAIThinking, currentPlayer, lastAIMoveTime, makeSpecificAIMove]);

  // Initialize game state and connect to backend - only run once when config changes
  useEffect(() => {
    const currentConfigHash = getConfigHash(config);
    
    console.log('GamePage: useEffect triggered with config hash:', currentConfigHash);
    console.log('GamePage: Previous config hash:', configHashRef.current);
    console.log('GamePage: gameInitializedRef.current:', gameInitializedRef.current);
    
    // Only initialize if config actually changed or not initialized yet
    if (config && config.rows && config.cols && 
        (configHashRef.current !== currentConfigHash || !gameInitializedRef.current)) {
      
      console.log('GamePage: Starting game initialization...');
      gameInitializedRef.current = true;
      configHashRef.current = currentConfigHash;
      
      // Reset game over state immediately when starting a new configuration
      setIsGameOver(false);
      setWinner(null);
      setIsAIThinking(false);
      setIsAutoplay(false);
      setMoveCount(0);
      setCurrentPlayer('RED'); // Will be updated by backend or config
      
      // IMMEDIATELY set fresh game state to prevent showing old winning state
      const freshBoard = Array(config.rows).fill(null).map(() => 
        Array(config.cols).fill(null).map(() => ({ 
          orbs: 0, 
          player: 'EMPTY' 
        }))
      );
      
      setGameState({
        board: freshBoard,
        scores: { RED: 0, BLUE: 0 },
        rows: config.rows,
        cols: config.cols,
        mode: config.mode,
        ...(config.mode === 'AI_VS_AI' ? {
          redAI: config.redAI,
          blueAI: config.blueAI
        } : {
          aiType: config.aiType,
          difficulty: config.difficulty
        })
      });
      
      console.log('GamePage: Fresh board state set immediately to prevent latency');
      
      // Simple direct initialization without complex function dependencies
      const initGame = async () => {
        try {
          // For backend modes
          if (config.mode === 'USER_VS_USER' || config.mode === 'USER_VS_AI' || config.mode === 'AI_VS_AI') {
            console.log('GamePage: Initializing backend with config:', config);
            
            // Remove gameSessionId before sending to backend (it's only for frontend state management)
            // eslint-disable-next-line no-unused-vars
            const { gameSessionId, ...backendConfig } = config;
            
            const response = await fetch('http://localhost:3001/api/game/init', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(backendConfig),
            });
            
            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || 'Failed to initialize backend');
            }
            
            console.log('GamePage: Backend initialized successfully');
            setIsBackendConnected(true);
            
            // Fetch game state
            const stateResponse = await fetch('http://localhost:3001/api/game/state');
            const stateResult = await stateResponse.json();
            
            if (stateResult.success && stateResult.gameState) {
              console.log('GamePage: Setting game state from backend:', stateResult.gameState);
              
              setGameState({
                board: stateResult.gameState.board,
                scores: stateResult.gameState.scores,
                rows: stateResult.gameState.board.length,
                cols: stateResult.gameState.board[0]?.length || 0,
                mode: config.mode,
                // Handle different config formats
                ...(config.mode === 'AI_VS_AI' ? {
                  redAI: config.redAI,
                  blueAI: config.blueAI
                } : {
                  aiType: config.aiType,
                  difficulty: config.difficulty
                })
              });
              
              setCurrentPlayer(stateResult.gameState.currentPlayer);
              setMoveCount(stateResult.gameState.moveCount);
              
              // For fresh game initialization, ignore game over state from backend
              // as it might be stale from previous game
              if (stateResult.gameState.moveCount === 0) {
                console.log('GamePage: Fresh game detected, resetting game over state');
                setIsGameOver(false);
                setWinner(null);
              } else {
                setIsGameOver(stateResult.gameState.gameOver);
                setWinner(stateResult.gameState.winner);
              }
              
              console.log('GamePage: Game state loaded successfully from backend');
              
              // If AI should start first, trigger AI move
              if (config.mode === 'USER_VS_AI' && config.firstPlayer === 'AI') {
                setTimeout(() => {
                  setIsAIThinking(true);
                  makeAIMove();
                }, 1000);
              }
            }
          } else {
            // For frontend-only modes
            console.log('GamePage: Initializing local game board...');
            
            const board = Array(config.rows).fill(null).map(() => 
              Array(config.cols).fill(null).map(() => ({ 
                orbs: 0, 
                player: 'EMPTY' 
              }))
            );
            
            setGameState({
              board: board,
              scores: { RED: 0, BLUE: 0 },
              rows: config.rows,
              cols: config.cols,
              mode: config.mode,
              aiType: config.aiType,
              difficulty: config.difficulty
            });
            
            setCurrentPlayer(config.firstPlayer === 'AI' ? 'BLUE' : 'RED');
            setIsGameOver(false);
            setWinner(null);
            setMoveCount(0);
            
            console.log('GamePage: Local game state initialized successfully');
          }
        } catch (error) {
          console.error('GamePage: Failed to initialize game:', error);
          setIsBackendConnected(false);
          gameInitializedRef.current = false;
          configHashRef.current = '';
        }
      };
      
      initGame();
    }
  }, [config, makeAIMove, resetTrigger]); // Add resetTrigger to dependencies
  
  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (gameState && config.mode === 'USER_VS_AI' && !isGameOver && !isAIThinking) {
      const aiPlayer = config.firstPlayer === 'AI' ? 'RED' : 'BLUE';
      
      if (currentPlayer === aiPlayer) {
        console.log('GamePage: AI turn detected, making AI move...');
        // Add small delay before AI move for better UX (only if AI doesn't already take time)
        const moveDelay = 300; // 300ms delay for smooth transitions
        setTimeout(() => {
          makeAIMove();
        }, moveDelay);
      }
    }
  }, [currentPlayer, gameState, isGameOver, config.mode, config.firstPlayer, makeAIMove, isAIThinking]);

  // Reset initialization flag when config changes
  useEffect(() => {
    gameInitializedRef.current = false;
  }, [config?.mode, config?.rows, config?.cols]);

  // Calculate critical mass for a cell
  const getCriticalMass = (row, col) => {
    if (!config) return 4;
    
    const isCorner = (row === 0 || row === config.rows - 1) && 
                     (col === 0 || col === config.cols - 1);
    const isEdge = row === 0 || row === config.rows - 1 || 
                   col === 0 || col === config.cols - 1;
    
    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
  };

  // Calculate scores from board (for frontend-only modes)
  const calculateScores = (board) => {
    const scores = { RED: 0, BLUE: 0 };
    for (const row of board) {
      for (const cell of row) {
        if (cell.player === 'RED') {
          scores.RED += cell.orbs;
        } else if (cell.player === 'BLUE') {
          scores.BLUE += cell.orbs;
        }
      }
    }
    return scores;
  };

  // Handle cell click for making moves
  const makeMove = async (row, col) => {
    console.log('GamePage: makeMove called for cell:', row, col, 'current game state:', gameState);
    
    if (isGameOver || !gameState) {
      console.log('GamePage: Move blocked - game over or no game state');
      return;
    }

    // In AI vs AI mode, prevent human from making moves
    if (config.mode === 'AI_VS_AI') {
      console.log('GamePage: Move blocked - AI vs AI mode, use AI move buttons');
      return;
    }
    
    // In Human vs AI mode, prevent human from moving when it's AI's turn
    if (config.mode === 'USER_VS_AI') {
      const humanPlayer = config.firstPlayer === 'AI' ? 'BLUE' : 'RED';
      if (currentPlayer !== humanPlayer) {
        console.log('GamePage: Move blocked - it\'s AI\'s turn');
        return;
      }
      
      // Also block moves when AI is thinking
      if (isAIThinking) {
        console.log('GamePage: Move blocked - AI is thinking');
        return;
      }
    }
    
    console.log('GamePage: Current board state:', gameState.board);
    
    const cell = gameState.board[row][col];
    console.log('GamePage: Clicked cell state:', cell);
    
    // Check if move is valid
    if (cell.player !== 'EMPTY' && cell.player !== currentPlayer) {
      console.log('GamePage: Invalid move - cell belongs to opponent');
      return;
    }
    
    // Create new board state (basic move without explosions)
    const newBoard = gameState.board.map(boardRow => 
      boardRow.map(boardCell => ({ ...boardCell }))
    );
    
    // Add orb to clicked cell
    newBoard[row][col] = {
      orbs: cell.orbs + 1,
      player: currentPlayer
    };
    
    console.log('GamePage: Added orb to cell:', row, col, 'new orbs:', newBoard[row][col].orbs);
    
    // For human vs human mode, use backend synchronization
    if (config.mode === 'USER_VS_USER' && isBackendConnected) {
      // Send move to backend via HTTP API (send ORIGINAL board state, not the modified one)
      try {
        const response = await fetch('http://localhost:3001/api/game/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: gameState.board, // Send original board state
            row,
            col,
            currentPlayer
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          console.log('GamePage: Move processed by backend successfully');
          
          // If backend returned updated game state, use it
          if (result.gameState) {
            console.log('GamePage: Updating game state from backend:', result.gameState);
            setGameState(prevState => ({
              ...prevState,
              board: result.gameState.board,
              scores: result.gameState.scores
            }));
            setMoveCount(result.gameState.moveCount);
            setCurrentPlayer(result.gameState.currentPlayer);
            
            // Check for game over
            if (result.gameState.gameOver) {
              setIsGameOver(true);
              setWinner(result.gameState.winner);
            }
            return;
          } else {
            // Backend processed move but didn't return updated state
            // Update UI immediately for responsiveness
            const updatedScores = calculateScores(newBoard);
            setGameState({
              ...gameState,
              board: newBoard,
              scores: updatedScores
            });
            setMoveCount(moveCount + 1);
            const nextPlayer = currentPlayer === 'RED' ? 'BLUE' : 'RED';
            setCurrentPlayer(nextPlayer);
            return;
          }
        } else {
          console.error('GamePage: Backend rejected move:', result.error);
          return; // Don't make the move if backend rejected it
        }
      } catch (error) {
        console.error('GamePage: Failed to send move to backend, using frontend fallback:', error);
        // Fall through to frontend-only logic
      }
    }
    
    // For Human vs AI mode, handle the flow differently
    if (config.mode === 'USER_VS_AI') {
      try {
        // Send human move to backend
        const response = await fetch('http://localhost:3001/api/game/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: gameState.board,
            row,
            col,
            currentPlayer
          }),
        });
        
        const result = await response.json();
        if (result.success && result.gameState) {
          // Update game state with human move
          setGameState(prevState => ({
            ...prevState,
            board: result.gameState.board,
            scores: result.gameState.scores
          }));
          setMoveCount(result.gameState.moveCount);
          setCurrentPlayer(result.gameState.currentPlayer);
          
          // Check for game over after human move
          if (result.gameState.gameOver) {
            setIsGameOver(true);
            setWinner(result.gameState.winner);
            return;
          }
          
          // Trigger AI move after a short delay for better UX
          setTimeout(() => {
            makeAIMove();
          }, 500);
          
          return;
        } else {
          console.error('GamePage: Human move failed in AI mode:', result.error);
          return;
        }
      } catch (error) {
        console.error('GamePage: Failed to process human move in AI mode:', error);
        return;
      }
    }
    
    // Frontend-only logic for other modes or when backend is unavailable
    const updatedScores = calculateScores(newBoard);
    setGameState({
      ...gameState,
      board: newBoard,
      scores: updatedScores
    });
    
    const newMoveCount = moveCount + 1;
    setMoveCount(newMoveCount);
    
    // Switch player
    const nextPlayer = currentPlayer === 'RED' ? 'BLUE' : 'RED';
    setCurrentPlayer(nextPlayer);
    console.log('GamePage: Switched to player:', nextPlayer);
  };

  // Reset game
  const resetGame = async () => {
    console.log('GamePage: Resetting game');
    
    // Stop autoplay when resetting
    setIsAutoplay(false);
    
    // FIRST: Call backend reset endpoint to clear backend state
    try {
      console.log('GamePage: Calling backend reset...');
      const resetResponse = await fetch('http://localhost:3001/api/game/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const resetResult = await resetResponse.json();
      if (resetResult.success) {
        console.log('GamePage: Backend reset successful');
      } else {
        console.error('GamePage: Backend reset failed:', resetResult.error);
      }
    } catch (error) {
      console.error('GamePage: Failed to reset backend:', error);
    }
    
    // Reset frontend state completely
    setIsBackendConnected(false);
    setIsGameOver(false);
    setWinner(null);
    setMoveCount(0);
    setCurrentPlayer('RED');
    setIsAIThinking(false);
    setIsAutoplay(false); // Reset autoplay state
    setLastAIMoveTime(0); // Reset AI move timing
    
    // Clear refs to force re-initialization
    gameInitializedRef.current = false;
    configHashRef.current = ''; 
    
    // Set gameState to null to show loading state
    setGameState(null);
    
    console.log('GamePage: Game reset completed, forcing re-initialization...');
    
    // Trigger re-initialization by incrementing resetTrigger
    // This will cause the useEffect to re-run even with the same config
    setResetTrigger(prev => prev + 1);
  };

  if (!gameState) {
    return (
      <Layout title="Loading Game...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-xl text-slate-300">Initializing game...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Chain Reaction - ${config.mode.replace('_', ' ')}`}>
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onGoHome}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg border border-slate-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button 
              onClick={resetGame}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg border border-slate-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
          
          <GameStatus 
            currentPlayer={currentPlayer}
            moveCount={moveCount}
            isGameOver={isGameOver}
            winner={winner}
            isAIThinking={isAIThinking}
          />
        </div>

        {/* ScoreBoard - positioned above the game */}
        <div className="mb-6">
          <ScoreBoard 
            scores={gameState?.scores}
            currentPlayer={currentPlayer}
            isGameOver={isGameOver}
            winner={winner}
            compact={true}
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            {/* AI vs AI Controls */}
            {config.mode === 'AI_VS_AI' && (
              <div className="mb-4 bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <span>AI vs AI Controls</span>
                </h3>
                
                <div className="flex flex-wrap gap-3 items-center justify-center">
                  {/* Red AI Move Button */}
                  <button
                    onClick={() => makeSpecificAIMove('RED')}
                    disabled={isGameOver || currentPlayer !== 'RED' || isAIThinking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      currentPlayer === 'RED' && !isGameOver && !isAIThinking
                        ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg shadow-red-500/25'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span>Red AI Move</span>
                    {currentPlayer === 'RED' && !isGameOver && (
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  {/* Blue AI Move Button */}
                  <button
                    onClick={() => makeSpecificAIMove('BLUE')}
                    disabled={isGameOver || currentPlayer !== 'BLUE' || isAIThinking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      currentPlayer === 'BLUE' && !isGameOver && !isAIThinking
                        ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg shadow-blue-500/25'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Blue AI Move</span>
                    {currentPlayer === 'BLUE' && !isGameOver && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  {/* Autoplay Button */}
                  <button
                    onClick={toggleAutoplay}
                    disabled={isGameOver}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      isAutoplay
                        ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 shadow-lg shadow-orange-500/25'
                        : isGameOver
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-lg shadow-green-500/25'
                    }`}
                  >
                    {isAutoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isAutoplay ? 'Stop Autoplay' : 'Start Autoplay'}</span>
                    {isAutoplay && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    )}
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="mt-3 text-center">
                  {isAIThinking ? (
                    <div className="flex items-center justify-center space-x-2 text-yellow-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  ) : isAutoplay ? (
                    <div className="flex items-center justify-center space-x-2 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span className="text-sm">Autoplay active</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      Click {currentPlayer === 'RED' ? 'Red' : 'Blue'} AI Move or Start Autoplay
                    </span>
                  )}
                </div>
              </div>
            )}

            <GameBoard 
              board={gameState.board}
              onCellClick={makeMove}
              isGameOver={isGameOver}
              currentPlayer={currentPlayer}
              getCriticalMass={getCriticalMass}
            />
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
            <PlayerInfo 
              config={config}
              currentPlayer={currentPlayer}
              isAIThinking={isAIThinking}
            />
            
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5 text-indigo-500" />
                <span>Game Info</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Grid Size:</span>
                  <span className="text-white">{config.rows}×{config.cols}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Move Count:</span>
                  <span className="text-white">{moveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mode:</span>
                  <span className="text-white">{config.mode.replace('_', ' ')}</span>
                </div>
                {config.mode === 'USER_VS_USER' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Backend:</span>
                    <span className={`text-sm ${isBackendConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isBackendConnected ? '● Connected' : '● Disconnected'}
                    </span>
                  </div>
                )}
                {(config.mode === 'USER_VS_AI' || config.mode === 'AI_VS_AI') && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">AI Type:</span>
                      <span className="text-white">{config.aiType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Difficulty:</span>
                      <span className="text-white">{config.difficulty}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm text-center max-w-md">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-xl text-slate-300 mb-6">
                {winner === 'RED' ? 'Red Player' : 'Blue Player'} Wins!
              </p>
              <div className="flex space-x-4 justify-center">
                <button 
                  onClick={() => {
                    // Reset game over state immediately to hide modal
                    setIsGameOver(false);
                    setWinner(null);
                    // Then show config modal
                    onShowConfigModal();
                  }} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Play Again
                </button>
                <button 
                  onClick={onGoHome} 
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg border border-slate-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GamePage;
