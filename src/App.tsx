import { useState, useCallback } from 'react';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import HowToPlay from '@/components/game/HowToPlay';
import Leaderboard from '@/components/game/Leaderboard';
import SettingsScreen from '@/components/game/SettingsScreen';
import './App.css';

type AppScreen = 'main_menu' | 'playing' | 'how_to_play' | 'leaderboard' | 'settings';

function App() {
  const [screen, setScreen] = useState<AppScreen>('main_menu');

  const handlePlay = useCallback(() => {
    setScreen('playing');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen('main_menu');
  }, []);

  const handleResetProgress = useCallback(() => {
    localStorage.removeItem('slimeRancherSave');
    setScreen('main_menu');
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {screen === 'main_menu' && (
        <MainMenu
          onPlay={handlePlay}
          onSettings={() => setScreen('settings')}
          onHowToPlay={() => setScreen('how_to_play')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'playing' && (
        <GameCanvas onBackToMenu={handleBackToMenu} />
      )}

      {screen === 'how_to_play' && (
        <div className="relative w-full h-screen">
          {/* Show game canvas in background */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-to-b from-indigo-900 to-purple-900" />
          </div>
          <HowToPlay onClose={() => setScreen('main_menu')} />
        </div>
      )}

      {screen === 'leaderboard' && (
        <div className="relative w-full h-screen">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-to-b from-yellow-900 to-amber-900" />
          </div>
          <Leaderboard onClose={() => setScreen('main_menu')} />
        </div>
      )}

      {screen === 'settings' && (
        <div className="relative w-full h-screen">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900" />
          </div>
          <SettingsScreen
            onClose={() => setScreen('main_menu')}
            onResetProgress={handleResetProgress}
          />
        </div>
      )}
    </div>
  );
}

export default App;
