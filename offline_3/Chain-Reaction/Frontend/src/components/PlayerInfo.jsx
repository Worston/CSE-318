import { User, Bot, Zap, Brain } from 'lucide-react';

const PlayerInfo = ({ config, currentPlayer, isAIThinking }) => {
  const getPlayerType = (player) => {
    if (config.mode === 'USER_VS_USER') return 'Human';
    if (config.mode === 'AI_VS_AI' || config.mode === 'AI vs AI') return 'AI';
    if (config.mode === 'USER_VS_AI' || config.mode === 'User vs AI') {
      // Handle different casing variations
      const firstPlayerAI = config.firstPlayer === 'AI' || config.firstPlayer === 'ai';
      const firstPlayerHuman = config.firstPlayer === 'HUMAN' || config.firstPlayer === 'Human' || config.firstPlayer === 'human';
      
      if (firstPlayerHuman) {
        return player === 'RED' ? 'Human' : 'AI';
      } else if (firstPlayerAI) {
        return player === 'RED' ? 'AI' : 'Human';
      }
    }
    return 'Human';
  };

  const getPlayerAIConfig = (player) => {
    // For AI vs AI mode with individual AI configurations
    if (config.mode === 'AI_VS_AI' && config.redAI && config.blueAI) {
      return player === 'RED' ? config.redAI : config.blueAI;
    }
    // For legacy modes with single AI configuration
    return {
      type: config.aiType,
      difficulty: config.difficulty,
      heuristic: config.heuristic
    };
  };

  const getPlayerIcon = (player) => {
    const playerType = getPlayerType(player);
    if (playerType === 'AI') {
      const aiConfig = getPlayerAIConfig(player);
      // Check for Smart AI variations
      return (aiConfig.type === 'Smart' || aiConfig.type === 'SMART' || aiConfig.type === 'MINIMAX') ? 
        <Brain className="w-5 h-5" /> : <Zap className="w-5 h-5" />;
    }
    return <User className="w-5 h-5" />;
  };

  const getPlayerDescription = (player) => {
    const playerType = getPlayerType(player);
    if (playerType === 'AI') {
      const aiConfig = getPlayerAIConfig(player);
      
      // Debug logging
      console.log(`PlayerInfo: ${player} - playerType: ${playerType}, aiConfig:`, aiConfig);
      
      // Check for Smart AI variations
      if (aiConfig.type === 'Smart' || aiConfig.type === 'SMART' || aiConfig.type === 'MINIMAX') {
        const difficulty = aiConfig.difficulty || 'Medium';
        const heuristic = aiConfig.heuristic;
        return `Smart AI (${difficulty})${heuristic ? ` - ${heuristic}` : ''}`;
      }
      // For Random AI
      if (aiConfig.type === 'Random' || aiConfig.type === 'RANDOM') {
        return 'Random AI';
      }
      // Fallback
      return 'AI Player';
    }
    return 'Human Player';
  };

  const isActivePlayer = (player) => {
    return currentPlayer === player && !isAIThinking;
  };

  const isThinking = (player) => {
    return currentPlayer === player && isAIThinking;
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
      
      <div className="space-y-4">
        {/* Red Player */}
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
          isActivePlayer('RED') 
            ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/25' 
            : 'border-slate-600 bg-slate-800/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-red-500">
                {getPlayerIcon('RED')}
              </div>
              <div>
                <h4 className="font-semibold text-white">Red Player</h4>
                <p className="text-xs text-slate-400">{getPlayerDescription('RED')}</p>
              </div>
            </div>
            {isActivePlayer('RED') && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
            {isThinking('RED') && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
            )}
          </div>
        </div>

        {/* Blue Player */}
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
          isActivePlayer('BLUE') 
            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25' 
            : 'border-slate-600 bg-slate-800/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                {getPlayerIcon('BLUE')}
              </div>
              <div>
                <h4 className="font-semibold text-white">Blue Player</h4>
                <p className="text-xs text-slate-400">{getPlayerDescription('BLUE')}</p>
              </div>
            </div>
            {isActivePlayer('BLUE') && (
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            {isThinking('BLUE') && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
          </div>
        </div>
      </div>

      {/* Current Turn Indicator */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-1">Current Turn</p>
          <div className={`flex items-center justify-center space-x-2 ${
            currentPlayer === 'RED' ? 'text-red-500' : 'text-blue-500'
          }`}>
            {getPlayerIcon(currentPlayer)}
            <span className="font-semibold">
              {currentPlayer === 'RED' ? 'Red' : 'Blue'} Player
            </span>
          </div>
          {isAIThinking && (
            <p className="text-xs text-yellow-500 mt-1 animate-pulse">
              AI is thinking...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
