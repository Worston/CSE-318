import { User, Bot, Clock, Crown } from 'lucide-react';

const GameStatus = ({ currentPlayer, moveCount, isGameOver, winner, isAIThinking }) => {
  const getPlayerIcon = (player) => {
    return player === 'RED' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />;
  };

  const getPlayerColor = (player) => {
    return player === 'RED' ? 'text-red-500' : 'text-blue-500';
  };

  if (isGameOver) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm text-center">
        <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-white mb-1">Game Over!</h3>
        <p className={`text-lg font-semibold ${getPlayerColor(winner)}`}>
          {winner === 'RED' ? 'Red Player' : 'Blue Player'} Wins!
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Total moves: {moveCount}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">Moves: {moveCount}</span>
        </div>
        
        <div className="border-l border-slate-600 pl-4">
          <div className="flex items-center space-x-2">
            <div className={`${getPlayerColor(currentPlayer)} flex items-center space-x-2`}>
              {getPlayerIcon(currentPlayer)}
              <span className="font-semibold">
                {currentPlayer === 'RED' ? 'Red Player' : 'Blue Player'}
              </span>
            </div>
            {isAIThinking && (
              <div className="flex items-center space-x-2 text-yellow-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAIThinking ? 'AI is calculating move...' : 'Your turn to play'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameStatus;
