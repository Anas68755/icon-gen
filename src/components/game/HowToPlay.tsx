import { X, Keyboard, Sprout, Gem, Zap, Heart, Wind, CloudSun, Star } from 'lucide-react';

interface HowToPlayProps {
  onClose: () => void;
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-[600px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" /> How to Play
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Controls Section */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-400" /> Controls
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { keys: 'WASD / Arrows', action: 'Move your character' },
                { keys: 'Shift', action: 'Sprint (faster movement)' },
                { keys: 'Space', action: 'Dash (quick burst)' },
                { keys: 'Left Click (hold)', action: 'Vacuum (suck in items)' },
                { keys: 'Right Click (hold)', action: 'Blower (push items away)' },
                { keys: 'F', action: 'Feed nearby slime' },
                { keys: 'E', action: 'Interact / Open panels' },
                { keys: 'Q', action: 'Toggle inventory bar' },
                { keys: 'M', action: 'Toggle minimap' },
                { keys: '1-9', action: 'Select inventory slot' },
                { keys: 'Esc', action: 'Pause game' },
              ].map((control) => (
                <div key={control.keys} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-cyan-300 whitespace-nowrap shrink-0">
                    {control.keys}
                  </kbd>
                  <span className="text-white/70 text-sm">{control.action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Gameplay Section */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-400" /> Gameplay Basics
            </h3>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Gem className="w-4 h-4 text-pink-400" /> Collect Slimes
                </div>
                Use your vacuum gun to suck up slimes and store them in your inventory. Each slime type is unique!
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-orange-400" /> Feed Your Slimes
                </div>
                Find food in the world or grow it in your garden. Feed slimes their favorite food for bonus happiness!
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> Collect Plorts
                </div>
                Fed, happy slimes produce plorts. Vacuum them up and sell them at the market for Newbucks!
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" /> Keep Slimes Happy
                </div>
                Happy slimes produce more plorts. Overfed slimes bounce faster temporarily. Hungry slimes stop producing.
              </div>
            </div>
          </section>

          {/* Slime Types */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" /> Slime Types
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Pink Slime', color: '#FF69B4', diet: 'Everything', value: 10, desc: 'The basic friendly slime' },
                { name: 'Tabby Slime', color: '#A0A0A0', diet: 'Meat', value: 22, desc: 'Cat-like, loves to pounce' },
                { name: 'Rock Slime', color: '#808080', diet: 'Vegetables', value: 30, desc: 'Hard-shelled and slow' },
                { name: 'Phosphor Slime', color: '#40E0D0', diet: 'Fruit', value: 45, desc: 'Glows at night, has wings' },
                { name: 'Honey Slime', color: '#DAA520', diet: 'Fruit', value: 55, desc: 'Attracts other slimes' },
                { name: 'Boom Slime', color: '#FF4500', diet: 'Meat', value: 65, desc: 'Explodes when stressed!' },
                { name: 'Golden Slime', color: '#FFD700', diet: 'N/A', value: 500, desc: 'Ultra rare! Hit it for plorts!' },
                { name: 'Tarr Slime', color: '#2D004D', diet: 'Slimes', value: 0, desc: 'Dangerous! Keep away!' },
              ].map((slime) => (
                <div key={slime.name} className="p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: slime.color }} />
                    <span className="text-white font-semibold text-sm">{slime.name}</span>
                  </div>
                  <div className="text-white/40 text-xs">{slime.desc}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-white/50">Diet: {slime.diet}</span>
                    <span className="text-yellow-400">${slime.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Biomes */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-cyan-400" /> Biomes
            </h3>
            <div className="space-y-2 text-white/70 text-sm">
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white font-semibold">The Ranch</span> - Your home base with corrals and gardens.
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white font-semibold">Dry Reef</span> - Rocky coast with Rock and Phosphor slimes.
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white font-semibold">Moss Blanket</span> - Dense forest with Honey and Boom slimes.
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white font-semibold">Indigo Quarry</span> - Crystal caves with Crystal and Rad slimes.
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Wind className="w-5 h-5 text-green-400" /> Pro Tips
            </h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">1.</span>
                Feed slimes their favorite food for double happiness and more plorts!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">2.</span>
                Two different slimes that eat plorts can fuse into a Largo - worth more!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">3.</span>
                Golden slimes appear randomly - hit them with your blower for rare plorts!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">4.</span>
                Watch out for Tarr slimes! They eat other slimes and multiply!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">5.</span>
                Weather affects gameplay - food grows faster in the rain!
              </li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.02]"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
