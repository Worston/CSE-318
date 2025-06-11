import { Trophy, Target } from 'lucide-react';

const ScoreBoard = ({ scores, currentPlayer, isGameOver, winner, compact = false }) => {
  // Default scores if not provided
  const defaultScores = { RED: 0, BLUE: 0 };
  const currentScores = scores || defaultScores;

  const getPlayerDisplayName = (player) => {
    return player === 'RED' ? 'Red Player' : 'Blue Player';
  };

  const getPlayerColor = (player) => {
    return player === 'RED' ? 'text-red-400' : 'text-blue-400';
  };



  const isWinner = (player) => {
    return isGameOver && winner === player;
  };

  const isCurrentPlayer = (player) => {
    return !isGameOver && currentPlayer === player;
  };

  return (
    <div className={`bg-slate-800 rounded-xl shadow-xl border border-slate-700 backdrop-blur-sm ${
      compact ? 'p-4' : 'p-6'
    }`}>
      <h3 className={`font-semibold text-white flex items-center space-x-2 ${
        compact ? 'text-base mb-3' : 'text-lg mb-4'
      }`}>
        <Trophy className={`text-yellow-500 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span>Scoreboard</span>
      </h3>
      
      {compact ? (
        // Compact horizontal layout
        <div className="flex space-x-4">
          {/* Red Player Score */}
          <div className={`flex-1 p-2 rounded-lg border-2 transition-all duration-300 ${
            isWinner('RED') 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : isCurrentPlayer('RED')
              ? 'border-red-400 bg-red-400/10'
              : 'border-slate-600 bg-slate-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-red-500 ${isCurrentPlayer('RED') ? 'animate-pulse' : ''}`}></div>
                <span className={`font-medium text-red-400 text-sm`}>Red</span>
                {isWinner('RED') && <Trophy className="w-3 h-3 text-yellow-500" />}
              </div>
              <span className="text-white font-bold">{currentScores.RED}</span>
            </div>
          </div>

          {/* Blue Player Score */}
          <div className={`flex-1 p-2 rounded-lg border-2 transition-all duration-300 ${
            isWinner('BLUE') 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : isCurrentPlayer('BLUE')
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-slate-600 bg-slate-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-blue-500 ${isCurrentPlayer('BLUE') ? 'animate-pulse' : ''}`}></div>
                <span className={`font-medium text-blue-400 text-sm`}>Blue</span>
                {isWinner('BLUE') && <Trophy className="w-3 h-3 text-yellow-500" />}
              </div>
              <span className="text-white font-bold">{currentScores.BLUE}</span>
            </div>
          </div>

          {/* Score difference indicator - compact */}
          {!isGameOver && (currentScores.RED > 0 || currentScores.BLUE > 0) && (
            <div className="flex items-center px-3">
              <div className="text-xs text-slate-400">
                {currentScores.RED === currentScores.BLUE ? (
                  "Tied"
                ) : currentScores.RED > currentScores.BLUE ? (
                  <span className="text-red-400">+{currentScores.RED - currentScores.BLUE}</span>
                ) : (
                  <span className="text-blue-400">+{currentScores.BLUE - currentScores.RED}</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Original vertical layout
        <div className="space-y-3">
          {/* Red Player Score */}
          <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
            isWinner('RED') 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : isCurrentPlayer('RED')
              ? 'border-red-400 bg-red-400/10'
              : 'border-slate-600 bg-slate-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full bg-red-500 ${isCurrentPlayer('RED') ? 'animate-pulse' : ''}`}></div>
                <span className={`font-medium ${getPlayerColor('RED')}`}>
                  {getPlayerDisplayName('RED')}
                </span>
                {isWinner('RED') && <Trophy className="w-4 h-4 text-yellow-500" />}
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-white font-bold text-lg">{currentScores.RED}</span>
              </div>
            </div>
          </div>

          {/* Blue Player Score */}
          <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
            isWinner('BLUE') 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : isCurrentPlayer('BLUE')
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-slate-600 bg-slate-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full bg-blue-500 ${isCurrentPlayer('BLUE') ? 'animate-pulse' : ''}`}></div>
                <span className={`font-medium ${getPlayerColor('BLUE')}`}>
                  {getPlayerDisplayName('BLUE')}
                </span>
                {isWinner('BLUE') && <Trophy className="w-4 h-4 text-yellow-500" />}
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-white font-bold text-lg">{currentScores.BLUE}</span>
              </div>
            </div>
          </div>

          {/* Score difference indicator */}
          {!isGameOver && (currentScores.RED > 0 || currentScores.BLUE > 0) && (
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="text-center text-sm text-slate-400">
                {currentScores.RED === currentScores.BLUE ? (
                  "Tied Game!"
                ) : currentScores.RED > currentScores.BLUE ? (
                  <span className="text-red-400">Red leads by {currentScores.RED - currentScores.BLUE}</span>
                ) : (
                  <span className="text-blue-400">Blue leads by {currentScores.BLUE - currentScores.RED}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;