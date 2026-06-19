import { useState } from 'react';
import { X, Volume2, Music, Monitor, RotateCcw, AlertTriangle, Check } from 'lucide-react';

interface SettingsScreenProps {
  onClose: () => void;
  onResetProgress: () => void;
}

export default function SettingsScreen({ onClose, onResetProgress }: SettingsScreenProps) {
  const [musicVolume, setMusicVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(70);
  const [showFps, setShowFps] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('slimeRancherSettings', JSON.stringify({
      musicVolume,
      sfxVolume,
      showFps,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-[450px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Volume2 className="w-8 h-8 text-blue-400" /> Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Music Volume */}
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="text-white font-semibold">Music Volume</span>
              </div>
              <span className="text-white/50 text-sm">{musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* SFX Volume */}
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">SFX Volume</span>
              </div>
              <span className="text-white/50 text-sm">{sfxVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume}
              onChange={(e) => setSfxVolume(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          {/* Display Options */}
          <div className="p-4 bg-white/5 rounded-xl space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" /> Display
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70 text-sm">Show FPS Counter</span>
              <div
                onClick={() => setShowFps(!showFps)}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${showFps ? 'bg-green-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${showFps ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70 text-sm">Show Damage Numbers</span>
              <div className="w-12 h-6 rounded-full bg-green-500">
                <div className="w-5 h-5 bg-white rounded-full shadow translate-x-6 mt-0.5" />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70 text-sm">Screen Shake</span>
              <div className="w-12 h-6 rounded-full bg-green-500">
                <div className="w-5 h-5 bg-white rounded-full shadow translate-x-6 mt-0.5" />
              </div>
            </label>
          </div>

          {/* Danger Zone */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/30 hover:bg-red-600/50 rounded-xl text-red-300 font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset All Progress
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-red-300 text-sm text-center">Are you sure? This cannot be undone!</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onResetProgress(); setConfirmReset(false); }}
                    className="flex-1 p-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-semibold transition-colors"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full mt-6 p-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${
            saved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
          }`}
        >
          {saved ? <><Check className="w-5 h-5" /> Saved!</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
