import { useState } from 'react';
import { User, Bot, Users, Settings, Play, X, Grid3x3 } from 'lucide-react';

const GameModeModal = ({ isOpen, onClose, onStartGame }) => {
  const [gameMode, setGameMode] = useState('USER_VS_AI');
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(6);
  const [aiType, setAIType] = useState('MINIMAX');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [firstPlayer, setFirstPlayer] = useState('HUMAN');
  const [heuristic, setHeuristic] = useState('combined_v2');
  
  //AI vs AI specific configurations
  const [redAIType, setRedAIType] = useState('MINIMAX');
  const [redAIDifficulty, setRedAIDifficulty] = useState('MEDIUM');
  const [redAIHeuristic, setRedAIHeuristic] = useState('combined_v2');
  const [blueAIType, setBlueAIType] = useState('MINIMAX');
  const [blueAIDifficulty, setBlueAIDifficulty] = useState('MEDIUM');
  const [blueAIHeuristic, setBlueAIHeuristic] = useState('orb_count');

  if (!isOpen) return null;

  const handleStartGame = () => {
    let gameConfig;
    
    if (gameMode === 'AI_VS_AI') {
      gameConfig = {
        mode: gameMode,
        rows: parseInt(rows),
        cols: parseInt(cols),
        redAI: {
          type: redAIType,
          difficulty: redAIDifficulty,
          heuristic: redAIType === 'MINIMAX' ? redAIHeuristic : null
        },
        blueAI: {
          type: blueAIType,
          difficulty: blueAIDifficulty,
          heuristic: blueAIType === 'MINIMAX' ? blueAIHeuristic : null
        },
        firstPlayer: 'RED' //Always start with Red in AI vs AI
      };
    } else {
      gameConfig = {
        mode: gameMode,
        rows: parseInt(rows),
        cols: parseInt(cols),
        aiType,
        difficulty,
        firstPlayer,
        heuristic: aiType === 'MINIMAX' ? heuristic : null
      };
    }
    
    console.log('GameModeModal: handleStartGame called with config:', gameConfig);
    
    if (onStartGame) {
      console.log('GameModeModal: Calling onStartGame callback');
      onStartGame(gameConfig);
    } else {
      console.log('GameModeModal: onStartGame callback is not provided');
    }
    onClose();
  };

  const gameModes = [
    {
      id: 'USER_VS_USER',
      name: 'Human vs Human',
      description: 'Play against another human player',
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 'USER_VS_AI',
      name: 'Human vs AI',
      description: 'Challenge our intelligent AI opponent',
      icon: <Bot className="w-6 h-6" />
    },
    {
      id: 'AI_VS_AI',
      name: 'AI vs AI',
      description: 'Watch two AI agents battle it out',
      icon: <Settings className="w-6 h-6" />
    }
  ];

  const difficulties = [
    { value: 'EASY', label: 'Easy', description: 'Depth 2 - Quick decisions' },
    { value: 'MEDIUM', label: 'Medium', description: 'Depth 3 - Balanced strategy' },
    { value: 'HARD', label: 'Hard', description: 'Depth 4 - Deep thinking' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Play className="w-8 h-8 text-indigo-500" />
            <span>Start New Game</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Game Mode Selection */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Game Mode</span>
            </h3>
            <div className="space-y-3">
              {gameModes.map((mode) => (
                <div key={mode.id} className="relative">
                  <input
                    type="radio"
                    id={mode.id}
                    name="gameMode"
                    value={mode.id}
                    checked={gameMode === mode.id}
                    onChange={(e) => setGameMode(e.target.value)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={mode.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      gameMode === mode.id
                        ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/25'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${gameMode === mode.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                        {mode.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{mode.name}</div>
                        <div className="text-sm text-slate-400">{mode.description}</div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Game Settings */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              <span>Game Settings</span>
            </h3>
            
            <div className="space-y-6">
              {/* Grid Size Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center space-x-2">
                  <Grid3x3 className="w-4 h-4 text-indigo-500" />
                  <span>Grid Dimensions</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Rows</label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={rows}
                      onChange={(e) => setRows(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Columns</label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={cols}
                      onChange={(e) => setCols(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="4"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Range: 3-10 for both rows and columns</p>
              </div>

              {/* AI Settings */}
              {gameMode === 'USER_VS_AI' && (
                <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">AI Type</label>
                        <select
                          value={aiType}
                          onChange={(e) => setAIType(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="MINIMAX">Minimax with Alpha-Beta Pruning</option>
                          <option value="RANDOM">Random AI</option>
                        </select>
                        {aiType === 'RANDOM' && (
                          <p className="text-xs text-slate-500 mt-1">Random AI makes random valid moves - no difficulty or strategy settings needed</p>
                        )}
                      </div>

                  {/* Difficulty Selection */}
                  {aiType === 'MINIMAX' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {difficulties.map((diff) => (
                          <option key={diff.value} value={diff.value}>
                            {diff.label} - {diff.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Heuristic Selection */}
                  {aiType === 'MINIMAX' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">AI Heuristic Strategy</label>
                      <select
                        value={heuristic}
                        onChange={(e) => setHeuristic(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="orb_count">Orb Count - Simple orb difference</option>
                        <option value="explosion_potential">Explosion Potential - Chain reaction focus</option>
                        <option value="strategic_control">Strategic Control - Board position control</option>
                        <option value="growth_potential">Growth Potential - Safe expansion</option>
                        <option value="threat_analysis">Threat Analysis - Defensive play</option>
                        <option value="tempo">Tempo - Initiative and forcing moves</option>
                        <option value="combined_v2">Combined v2 - Adaptive multi-heuristic</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">Different strategies provide varied playing styles</p>
                    </div>
                  )}
                </>
              )}

              {/* AI vs AI Settings */}
              {gameMode === 'AI_VS_AI' && (
                <div className="space-y-6">
                  {/* Red AI Configuration */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-red-500/30">
                    <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Red AI Configuration</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">AI Type</label>
                        <select
                          value={redAIType}
                          onChange={(e) => setRedAIType(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                        >
                          <option value="MINIMAX">Minimax with Alpha-Beta Pruning</option>
                          <option value="RANDOM">Random AI</option>
                        </select>
                        {redAIType === 'RANDOM' && (
                          <p className="text-xs text-slate-500 mt-1">Random AI makes random valid moves - no difficulty or strategy settings needed</p>
                        )}
                      </div>

                      {/* Difficulty Selection */}
                      {redAIType === 'MINIMAX' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                          <select
                            value={redAIDifficulty}
                            onChange={(e) => setRedAIDifficulty(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          >
                            {difficulties.map((diff) => (
                              <option key={diff.value} value={diff.value}>
                                {diff.label} - {diff.description}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {redAIType === 'MINIMAX' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Heuristic Strategy</label>
                          <select
                            value={redAIHeuristic}
                            onChange={(e) => setRedAIHeuristic(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          >
                            <option value="orb_count">Orb Count - Simple orb difference</option>
                            <option value="explosion_potential">Explosion Potential - Chain reaction focus</option>
                            <option value="strategic_control">Strategic Control - Board position control</option>
                            <option value="growth_potential">Growth Potential - Safe expansion</option>
                            <option value="threat_analysis">Threat Analysis - Defensive play</option>
                            <option value="tempo">Tempo - Initiative and forcing moves</option>
                            <option value="combined_v2">Combined v2 - Adaptive multi-heuristic</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blue AI Configuration */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-blue-500/30">
                    <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Blue AI Configuration</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">AI Type</label>
                        <select
                          value={blueAIType}
                          onChange={(e) => setBlueAIType(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="MINIMAX">Minimax with Alpha-Beta Pruning</option>
                          <option value="RANDOM">Random AI</option>
                        </select>
                        {blueAIType === 'RANDOM' && (
                          <p className="text-xs text-slate-500 mt-1">Random AI makes random valid moves - no difficulty or strategy settings needed</p>
                        )}
                      </div>

                      {/* Difficulty Selection */}
                      {blueAIType === 'MINIMAX' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                          <select
                            value={blueAIDifficulty}
                            onChange={(e) => setBlueAIDifficulty(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          >
                            {difficulties.map((diff) => (
                              <option key={diff.value} value={diff.value}>
                                {diff.label} - {diff.description}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {blueAIType === 'MINIMAX' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Heuristic Strategy</label>
                          <select
                            value={blueAIHeuristic}
                            onChange={(e) => setBlueAIHeuristic(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="orb_count">Orb Count - Simple orb difference</option>
                            <option value="explosion_potential">Explosion Potential - Chain reaction focus</option>
                            <option value="strategic_control">Strategic Control - Board position control</option>
                            <option value="growth_potential">Growth Potential - Safe expansion</option>
                            <option value="threat_analysis">Threat Analysis - Defensive play</option>
                            <option value="tempo">Tempo - Initiative and forcing moves</option>
                            <option value="combined_v2">Combined v2 - Adaptive multi-heuristic</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* First Player */}
              {gameMode === 'USER_VS_AI' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">First Player</label>
                  <select
                    value={firstPlayer}
                    onChange={(e) => setFirstPlayer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="HUMAN">Human (Red)</option>
                    <option value="AI">AI (Red)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-700">
          <button 
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg border border-slate-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Cancel
          </button>
          <button 
            onClick={handleStartGame}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModeModal;
