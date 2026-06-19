import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '@/game/GameEngine';
import type { GameScreen, BiomeType } from '@/game/types';
import {
  Pause, Play, Map, Settings, Home, ShoppingBag,
  Compass, Save, X, Lock,
  Sprout, Wallet, Sun, Moon, Wind, CloudRain, CloudLightning, CloudSun,
  Mountain, TreePine, Gem, Droplets,
  LogOut, Volume2
} from 'lucide-react';

interface GameCanvasProps {
  onBackToMenu: () => void;
}

export default function GameCanvas({ onBackToMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [screen, setScreen] = useState<GameScreen>('playing');
  const [newbucks, setNewbucks] = useState(500);
  const [day, setDay] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [weather, setWeather] = useState('clear');
  const [currentBiome, setCurrentBiome] = useState('ranch');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);

  // Sync engine state to React state
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      setScreen(state.screen);
      setNewbucks(state.player.newbucks);
      setDay(state.dayNight.day);
      setTimeOfDay(state.dayNight.isDay ? 'Day' : state.dayNight.isDusk ? 'Dusk' : 'Night');
      setWeather(state.weather.current);
      setCurrentBiome(state.currentBiome.type);
      setPaused(state.paused);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.startGame();

    return () => {
      engine.destroy();
    };
  }, []);

  const handleSellPlort = useCallback((type: string, count: number) => {
    engineRef.current?.sellPlort(type, count);
  }, []);

  const handleSellAll = useCallback(() => {
    engineRef.current?.sellAllPlorts();
  }, []);

  const handleTravelBiome = useCallback((biome: BiomeType) => {
    engineRef.current?.travelToBiome(biome);
    setScreen('playing');
  }, []);

  const handlePurchaseUpgrade = useCallback((upgradeId: string, cost: number) => {
    engineRef.current?.purchaseUpgrade(upgradeId, cost);
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.state.paused = false;
    }
    setScreen('playing');
  }, []);

  const handleSave = useCallback(() => {
    engineRef.current?.saveGame();
  }, []);

  // Get market data when opening market
  useEffect(() => {
    if (screen === 'market' && engineRef.current) {
      setMarketData(engineRef.current.getPlortMarketData());
    }
  }, [screen]);

  const weatherIcon = weather === 'clear' ? <Sun className="w-4 h-4" /> :
    weather === 'rain' ? <CloudRain className="w-4 h-4" /> :
    weather === 'storm' ? <CloudLightning className="w-4 h-4" /> :
    <Wind className="w-4 h-4" />;

  const timeIcon = timeOfDay === 'Day' ? <Sun className="w-4 h-4 text-yellow-400" /> :
    timeOfDay === 'Dusk' ? <CloudSun className="w-4 h-4 text-orange-400" /> :
    <Moon className="w-4 h-4 text-blue-300" />;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* HUD Overlay */}
      {screen === 'playing' && !paused && (
        <>
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-2 text-white/90">
                {timeIcon}
                <span className="text-sm font-bold">Day {day} - {timeOfDay}</span>
                <span className="text-white/60">{weatherIcon}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { if (engineRef.current) engineRef.current.state.showInventory = !engineRef.current.state.showInventory; }}
                  className="pointer-events-auto p-1.5 bg-black/40 rounded-lg hover:bg-black/60 transition-colors"
                >
                  <Sprout className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => { if (engineRef.current) engineRef.current.state.showMinimap = !engineRef.current.state.showMinimap; }}
                  className="pointer-events-auto p-1.5 bg-black/40 rounded-lg hover:bg-black/60 transition-colors"
                >
                  <Map className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => { if (engineRef.current) engineRef.current.state.paused = true; }}
                  className="pointer-events-auto p-1.5 bg-black/40 rounded-lg hover:bg-black/60 transition-colors"
                >
                  <Pause className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-bold">{newbucks}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'biome_select'; }}
              className="p-2.5 bg-black/50 backdrop-blur rounded-xl hover:bg-black/70 transition-all hover:scale-105 border border-white/10"
              title="Travel"
            >
              <Compass className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'market'; }}
              className="p-2.5 bg-black/50 backdrop-blur rounded-xl hover:bg-black/70 transition-all hover:scale-105 border border-white/10"
              title="Market"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'ranch_view'; }}
              className="p-2.5 bg-black/50 backdrop-blur rounded-xl hover:bg-black/70 transition-all hover:scale-105 border border-white/10"
              title="Ranch"
            >
              <Home className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Controls Help - Bottom Left */}
          <div className="absolute bottom-4 left-4 text-white/40 text-xs space-y-0.5 pointer-events-none">
            <div>WASD/Arrows: Move | Shift: Sprint | Space: Dash</div>
            <div>Left Click: Vacuum | Right Click: Blower</div>
            <div>F: Feed | E: Interact | Q: Inventory | M: Map</div>
          </div>
        </>
      )}

      {/* Pause Menu */}
      {paused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 w-80 space-y-4">
            <h2 className="text-2xl font-bold text-white text-center">Paused</h2>
            <div className="space-y-2">
              <button onClick={handleResume} className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold transition-colors">
                <Play className="w-5 h-5" /> Resume
              </button>
              <button onClick={() => setScreen('settings')} className="w-full flex items-center justify-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors">
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors">
                <Save className="w-5 h-5" /> Save Game
              </button>
              <button onClick={onBackToMenu} className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-semibold transition-colors">
                <LogOut className="w-5 h-5" /> Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Market Screen */}
      {screen === 'market' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-yellow-400" /> Plort Market
              </h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'playing'; }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <Wallet className="w-4 h-4" /> ${newbucks}
              </span>
              <button onClick={handleSellAll} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-semibold text-sm transition-colors">
                Sell All Plorts
              </button>
            </div>
            <div className="space-y-2">
              {marketData.filter(m => m.count > 0).map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '30' }}>
                      <Gem className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.name}</div>
                      <div className="text-white/50 text-xs">{item.count} in inventory</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-bold">${item.value}</span>
                    <button
                      onClick={() => handleSellPlort(item.type, item.count)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-semibold transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              ))}
              {marketData.filter(m => m.count > 0).length === 0 && (
                <div className="text-center text-white/40 py-8">No plorts to sell. Go collect some!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Biome Select */}
      {screen === 'biome_select' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Compass className="w-6 h-6 text-blue-400" /> Travel
              </h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'playing'; }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: 'ranch' as BiomeType, icon: <Home className="w-5 h-5" />, desc: 'Your home base' },
                { type: 'dry_reef' as BiomeType, icon: <Sun className="w-5 h-5" />, desc: 'Rocky coastal area' },
                { type: 'moss_blanket' as BiomeType, icon: <TreePine className="w-5 h-5" />, desc: 'Dense forest' },
                { type: 'indigo_quarry' as BiomeType, icon: <Mountain className="w-5 h-5" />, desc: 'Crystal caves' },
                { type: 'ancient_ruins' as BiomeType, icon: <Gem className="w-5 h-5" />, desc: 'Mystical ruins' },
                { type: 'glass_desert' as BiomeType, icon: <Droplets className="w-5 h-5" />, desc: 'Scorching desert' },
              ]).map((biome) => {
                const isUnlocked = engineRef.current?.state.unlockedBiomes.includes(biome.type);
                const config = {
                  ranch: { name: 'The Ranch', cost: 0, color: '#7ED321' },
                  dry_reef: { name: 'Dry Reef', cost: 500, color: '#F5A623' },
                  moss_blanket: { name: 'Moss Blanket', cost: 1500, color: '#2E7D32' },
                  indigo_quarry: { name: 'Indigo Quarry', cost: 3000, color: '#7B68EE' },
                  ancient_ruins: { name: 'Ancient Ruins', cost: 6000, color: '#8D6E63' },
                  glass_desert: { name: 'Glass Desert', cost: 10000, color: '#FF8F00' },
                }[biome.type];

                return (
                  <button
                    key={biome.type}
                    onClick={() => isUnlocked ? handleTravelBiome(biome.type) : handleTravelBiome(biome.type)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      isUnlocked
                        ? 'bg-white/5 border-white/10 hover:bg-white/15 hover:scale-[1.02]'
                        : 'bg-white/2 border-white/5 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: config.color + '20', color: config.color }}>
                        {isUnlocked ? biome.icon : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{config.name}</div>
                        <div className="text-white/40 text-xs">{biome.desc}</div>
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="mt-2 text-yellow-400 text-xs font-semibold">
                        Unlock: ${config.cost}
                      </div>
                    )}
                    {isUnlocked && biome.type === currentBiome && (
                      <div className="mt-2 text-green-400 text-xs font-semibold">
                        Current Location
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ranch View */}
      {screen === 'ranch_view' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Home className="w-6 h-6 text-green-400" /> Ranch Management
              </h2>
              <button onClick={() => { if (engineRef.current) engineRef.current.state.screen = 'playing'; }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Corrals */}
              <div>
                <h3 className="text-white/70 text-sm font-semibold mb-2">Corrals</h3>
                <div className="grid grid-cols-2 gap-2">
                  {engineRef.current?.getCorralData().map((corral) => (
                    <div key={corral.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-white font-semibold text-sm">Corral #{corral.id}</div>
                      <div className="text-white/40 text-xs mt-1">
                        {corral.slimes.length} slimes
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {corral.hasHighWalls && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">Walls</span>}
                        {corral.hasAutoFeeder && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded">Feeder</span>}
                        {corral.hasPlortCollector && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">Collector</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrades */}
              <div>
                <h3 className="text-white/70 text-sm font-semibold mb-2">Available Upgrades</h3>
                <div className="space-y-2">
                  {[
                    { id: 'high_walls', name: 'High Walls', desc: 'Slimes can\'t escape', cost: 500, icon: <Mountain className="w-4 h-4" /> },
                    { id: 'auto_feeder', name: 'Auto-Feeder', desc: 'Auto feeds every 2 min', cost: 1000, icon: <Sprout className="w-4 h-4" /> },
                    { id: 'plort_collector', name: 'Plort Collector', desc: 'Auto collects plorts', cost: 1500, icon: <Gem className="w-4 h-4" /> },
                    { id: 'music_box', name: 'Music Box', desc: '+10 slime happiness', cost: 2000, icon: <Volume2 className="w-4 h-4" /> },
                  ].map((upgrade) => (
                    <div key={upgrade.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg text-white/60">
                          {upgrade.icon}
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold">{upgrade.name}</div>
                          <div className="text-white/40 text-xs">{upgrade.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePurchaseUpgrade(upgrade.id, upgrade.cost)}
                        className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white text-xs font-semibold transition-colors"
                      >
                        ${upgrade.cost}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {screen === 'settings' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 w-80">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-gray-400" /> Settings
              </h2>
              <button onClick={() => setScreen('paused')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-white text-sm">Music Volume</span>
                <input type="range" min="0" max="100" defaultValue="50" className="w-24" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-white text-sm">SFX Volume</span>
                <input type="range" min="0" max="100" defaultValue="70" className="w-24" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-white text-sm">Show FPS</span>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <button
                onClick={() => setScreen('paused')}
                className="w-full mt-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
