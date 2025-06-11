import { useState } from 'react';
import { Play, BookOpen, Zap, Brain, Users, Trophy } from 'lucide-react';
import Layout from '../components/Layout';

const HomePage = ({ onShowConfigModal }) => {
  const [showRules, setShowRules] = useState(false);

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-indigo-500" />,
      title: "AI Minimax Agent",
      description: "Advanced AI with alpha-beta pruning and custom heuristics"
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Multiple Game Modes",
      description: "Human vs Human, Human vs AI, or AI vs AI battles"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Chain Explosions",
      description: "Experience cascading reactions with smooth animations"
    },
    {
      icon: <Trophy className="w-8 h-8 text-purple-500" />,
      title: "Strategy Game",
      description: "Master the art of strategic orb placement and timing"
    }
  ];

  return (
    <Layout title="Chain Reaction">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent animate-float">
          Chain Reaction
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Experience the explosive strategy game where every move creates ripple effects. 
          Place orbs strategically and watch chain reactions unfold in this battle of minds.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={onShowConfigModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-lg px-8 py-4 flex items-center space-x-3 group"
          >
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Start Playing</span>
          </button>
          
          <button 
            onClick={() => setShowRules(true)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg border border-slate-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-lg px-8 py-4 flex items-center space-x-3 group"
          >
            <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Game Rules</span>
          </button>
        </div>
        </div>      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm text-center hover:transform hover:scale-105 transition-all duration-300 hover:shadow-2xl group"
          >
            <div className="mb-4 flex justify-center group-hover:animate-bounce">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>      {/* Game Preview Section */}
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm text-center mb-16">
        <h2 className="text-3xl font-bold mb-6 text-white">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 animate-pulse-slow">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Place Orbs</h3>
            <p className="text-slate-400 text-sm">Click on empty cells or cells with your orbs to add more orbs</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 animate-spin-slow">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Chain Reactions</h3>
            <p className="text-slate-400 text-sm">When orbs reach critical mass, they explode and spread to adjacent cells</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 animate-bounce-gentle">
              👑
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Eliminate Opponents</h3>
            <p className="text-slate-400 text-sm">Convert enemy orbs and eliminate all opponent orbs to win</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm inline-block">
          <h2 className="text-2xl font-bold mb-4 text-white">Ready for the Challenge?</h2>
          <p className="text-slate-300 mb-6">Test your strategic thinking against our advanced AI</p>
          <button 
            onClick={onShowConfigModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-lg px-8 py-4"
          >
            Let's Play!
          </button>
        </div>
      </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <RulesModal 
          isOpen={showRules} 
          onClose={() => setShowRules(false)} 
        />
      )}
    </Layout>
  );
};

// Simple Rules Modal Component
const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Game Rules</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Objective</h3>
            <p>Eliminate all of your opponent's orbs by creating chain reactions.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">How to Play</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Players take turns placing orbs on the grid</li>
              <li>You can only place orbs in empty cells or cells with your orbs</li>
              <li>Each cell has a critical mass (number of adjacent cells)</li>
              <li>When orbs equal critical mass, they explode and spread</li>
              <li>Explosions convert enemy orbs and can create chain reactions</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Critical Mass</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Corner cells: 2 orbs</li>
              <li>Edge cells: 3 orbs</li>
              <li>Center cells: 4 orbs</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Winning</h3>
            <p>The first player to eliminate all enemy orbs wins the game!</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
