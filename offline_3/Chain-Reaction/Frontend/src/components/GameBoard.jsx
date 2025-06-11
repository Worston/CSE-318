import { useState, useEffect } from 'react';

const GameBoard = ({ board, onCellClick, isGameOver, currentPlayer, getCriticalMass }) => {
  const [animatingCells, setAnimatingCells] = useState(new Set());
  const [explosions, setExplosions] = useState(new Set());

  const handleCellClick = (row, col) => {
    if (isGameOver) return;
    onCellClick(row, col);
    
    // Add animation to the clicked cell
    const cellKey = `${row}-${col}`;
    setAnimatingCells(prev => new Set([...prev, cellKey]));
    
    // Remove animation after delay
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }, 600);
  };

  // Effect to detect and animate explosions
  useEffect(() => {
    const newExplosions = new Set();
    
    board.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        const criticalMass = getCriticalMass(rowIdx, colIdx);
        if (cell.orbs >= criticalMass && cell.player !== 'EMPTY') {
          newExplosions.add(`${rowIdx}-${colIdx}`);
        }
      });
    });
    
    setExplosions(newExplosions);
    
    // Clear explosions after animation
    if (newExplosions.size > 0) {
      setTimeout(() => setExplosions(new Set()), 1000);
    }
  }, [board, getCriticalMass]);

  const getCellClassName = (cell, row, col) => {
    const cellKey = `${row}-${col}`;
    const criticalMass = getCriticalMass(row, col);
    const isNearCritical = cell.orbs === criticalMass - 1 && cell.player !== 'EMPTY';
    const isCritical = cell.orbs >= criticalMass && cell.player !== 'EMPTY';
    const isAnimating = animatingCells.has(cellKey);
    const isExploding = explosions.has(cellKey);
    
    // Check if this is a valid move for the current player
    const isValidMove = !isGameOver && (cell.player === 'EMPTY' || cell.player === currentPlayer);
    
    let baseClasses = 'game-cell w-20 h-20 rounded-xl border-3 flex items-center justify-center font-bold text-lg transition-all duration-300 select-none relative overflow-hidden shadow-lg';
    
    // Cursor based on move validity
    if (isValidMove) {
      baseClasses += ' cursor-pointer';
    } else {
      baseClasses += ' cursor-not-allowed';
    }
    
    // Player colors with enhanced gradients and glow effects
    if (cell.player === 'RED') {
      baseClasses += ' bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-red-300 text-white shadow-red-500/50 hover:shadow-red-400/70';
    } else if (cell.player === 'BLUE') {
      baseClasses += ' bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-blue-300 text-white shadow-blue-500/50 hover:shadow-blue-400/70';
    } else {
      baseClasses += ' bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-slate-500 text-slate-300 hover:border-slate-400 hover:from-slate-500 hover:to-slate-600';
    }
    
    // Animation states
    if (isAnimating) {
      baseClasses += ' scale-110 ring-4 ring-yellow-400 ring-opacity-60';
    }
    
    if (isExploding) {
      baseClasses += ' animate-ping scale-125 ring-8 ring-red-500 ring-opacity-80';
    }
    
    if (isNearCritical) {
      baseClasses += ' animate-pulse ring-4 ring-yellow-400 ring-opacity-70 shadow-yellow-400/50';
    }
    
    if (isCritical) {
      baseClasses += ' ring-4 ring-red-500 ring-opacity-90 shadow-red-500/70 animate-pulse';
    }
    
    // Hover effects for valid moves only
    if (isValidMove) {
      baseClasses += ' hover:scale-105 hover:shadow-2xl transform transition-transform duration-200';
      if (currentPlayer === 'RED') {
        baseClasses += ' hover:ring-2 hover:ring-red-400 hover:ring-opacity-60';
      } else {
        baseClasses += ' hover:ring-2 hover:ring-blue-400 hover:ring-opacity-60';
      }
    } else {
      // Visual feedback for invalid moves
      baseClasses += ' opacity-75 hover:opacity-60';
    }
    
    return baseClasses;
  };

  const renderOrbs = (cell) => {
    console.log('GameBoard: renderOrbs called for cell:', cell);
    
    if (cell.player === 'EMPTY' || cell.orbs === 0) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-600 rounded-full opacity-20"></div>
        </div>
      );
    }

    const orbCount = Math.min(cell.orbs, 6); // Show up to 6 orbs visually
    const orbColor = cell.player === 'RED' ? 'from-red-200 to-red-100' : 'from-blue-200 to-blue-100';
    const shadowColor = cell.player === 'RED' ? 'shadow-red-500/60' : 'shadow-blue-500/60';
    const pulseColor = cell.player === 'RED' ? 'shadow-red-400/80' : 'shadow-blue-400/80';
    
    console.log('GameBoard: Rendering', orbCount, 'orbs for', cell.player, 'player');
    
    if (orbCount === 1) {
      return (
        <div className="relative">
          <div className={`w-6 h-6 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-lg ${shadowColor} ring-2 ring-white ring-opacity-50`}></div>
          <div className={`absolute inset-0 w-6 h-6 bg-gradient-to-br ${orbColor} rounded-full animate-ping opacity-75 ${pulseColor}`}></div>
        </div>
      );
    }
    
    if (orbCount === 2) {
      return (
        <div className="flex space-x-1">
          <div className={`w-5 h-5 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-5 h-5 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '200ms' }}></div>
        </div>
      );
    }
    
    if (orbCount === 3) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50 mb-1`} style={{ animationDelay: '0ms' }}></div>
          <div className="flex space-x-1">
            <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '100ms' }}></div>
            <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-bounce shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '200ms' }}></div>
          </div>
        </div>
      );
    }
    
    if (orbCount === 4) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '300ms' }}></div>
          <div className={`w-4 h-4 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor} ring-1 ring-white ring-opacity-50`} style={{ animationDelay: '450ms' }}></div>
        </div>
      );
    }
    
    if (orbCount >= 5) {
      return (
        <div className="relative">
          <div className="grid grid-cols-2 gap-1">
            <div className={`w-3 h-3 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor}`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-3 h-3 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor}`} style={{ animationDelay: '100ms' }}></div>
            <div className={`w-3 h-3 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor}`} style={{ animationDelay: '200ms' }}></div>
            <div className={`w-3 h-3 bg-gradient-to-br ${orbColor} rounded-full animate-spin shadow-md ${shadowColor}`} style={{ animationDelay: '300ms' }}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs font-bold text-white bg-black bg-opacity-70 rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {cell.orbs}
            </div>
          </div>
        </div>
      );
    }
    
    // For 4+ orbs, show number with enhanced styling
    return (
      <div className="relative">
        <div className="text-lg font-bold drop-shadow-lg">{cell.orbs}</div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
        {cell.orbs > 6 && (
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Game Board</h2>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Red Player</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Blue Player</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <span>Near Critical</span>
          </div>
        </div>
      </div>
      
      <div 
        className="grid gap-2 mx-auto p-4 bg-slate-800 rounded-lg border border-slate-600"
        style={{ 
          gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))`,
          maxWidth: 'fit-content'
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClassName(cell, rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              title={`Cell (${rowIndex}, ${colIndex}) - Critical Mass: ${getCriticalMass(rowIndex, colIndex)}`}
            >
              {renderOrbs(cell)}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-400">
          Click on empty cells or your orbs to make a move
        </p>
      </div>
    </div>
  );
};

export default GameBoard;
