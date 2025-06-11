import { useState } from 'react';
import HomePage from './pages/HomePage';
import GamePageNew from './pages/GamePageNew';
import GameModeModal from './components/GameModeModal';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [gameConfig, setGameConfig] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);

  const startGame = (config) => {
    console.log('App: startGame called with config:', config);
    // Add a unique game session ID to force re-initialization even with same config
    const configWithSessionId = {
      ...config,
      gameSessionId: Date.now() + Math.random() // Unique identifier for each game start
    };
    setGameConfig(configWithSessionId);
    setCurrentPage('game');
    setShowGameModal(false);
    console.log('App: Switched to game page with session ID:', configWithSessionId.gameSessionId);
  };

  const goHome = () => {
    console.log('App: goHome called');
    setCurrentPage('home');
    setGameConfig(null);
    setShowGameModal(false);
  };

  const showConfigModal = () => {
    console.log('App: showConfigModal called');
    setShowGameModal(true);
  };

  const renderPage = () => {
    console.log('App: renderPage called, currentPage:', currentPage);
    if (currentPage === 'game') {
      console.log('App: Rendering GamePageNew with config:', gameConfig);
      return <GamePageNew config={gameConfig} onGoHome={goHome} onShowConfigModal={showConfigModal} />;
    } else {
      console.log('App: Rendering HomePage');
      return <HomePage onShowConfigModal={showConfigModal} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
      <GameModeModal 
        isOpen={showGameModal} 
        onClose={() => setShowGameModal(false)}
        onStartGame={startGame}
      />
    </div>
  );
}

export default App;
