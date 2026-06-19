import { X, Trophy, Star, Medal, Crown, Calendar } from 'lucide-react';

interface LeaderboardProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  newbucks: number;
  plortsSold: number;
  slimesFed: number;
  days: number;
  playTime: string;
  avatar: string;
}

// Sample leaderboard data
const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'SlimeKing42', newbucks: 125000, plortsSold: 2847, slimesFed: 1523, days: 45, playTime: '48h 32m', avatar: '👑' },
  { rank: 2, name: 'RancherPro', newbucks: 98750, plortsSold: 2156, slimesFed: 1187, days: 38, playTime: '36h 15m', avatar: '🥈' },
  { rank: 3, name: 'PinkSlimeFan', newbucks: 76200, plortsSold: 1890, slimesFed: 945, days: 32, playTime: '29h 48m', avatar: '🥉' },
  { rank: 4, name: 'CrystalHunter', newbucks: 54300, plortsSold: 1234, slimesFed: 678, days: 25, playTime: '22h 10m', avatar: '💎' },
  { rank: 5, name: 'GoldenFinder', newbucks: 48900, plortsSold: 987, slimesFed: 534, days: 21, playTime: '18h 45m', avatar: '⭐' },
  { rank: 6, name: 'BoomMaster', newbucks: 36500, plortsSold: 876, slimesFed: 423, days: 18, playTime: '15h 22m', avatar: '💥' },
  { rank: 7, name: 'HoneyBee', newbucks: 28400, plortsSold: 654, slimesFed: 345, days: 15, playTime: '12h 08m', avatar: '🍯' },
  { rank: 8, name: 'PhosphorGlow', newbucks: 22100, plortsSold: 543, slimesFed: 287, days: 12, playTime: '9h 55m', avatar: '✨' },
  { rank: 9, name: 'TabbyWhiskers', newbucks: 18700, plortsSold: 432, slimesFed: 234, days: 10, playTime: '8h 12m', avatar: '🐱' },
  { rank: 10, name: 'RockSolid', newbucks: 12400, plortsSold: 321, slimesFed: 156, days: 8, playTime: '6h 30m', avatar: '🪨' },
];

export default function Leaderboard({ onClose }: LeaderboardProps) {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-8 w-[550px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" /> Leaderboard
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_80px_80px_80px] gap-2 px-3 py-2 text-white/40 text-xs font-semibold uppercase">
          <div>#</div>
          <div>Rancher</div>
          <div className="text-right">Newbucks</div>
          <div className="text-right">Plorts</div>
          <div className="text-right">Days</div>
        </div>

        {/* Entries */}
        <div className="space-y-1">
          {SAMPLE_LEADERBOARD.map((entry, index) => (
            <div
              key={entry.rank}
              className={`grid grid-cols-[40px_1fr_80px_80px_80px] gap-2 px-3 py-3 rounded-xl items-center transition-all hover:scale-[1.01] ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30' :
                index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-transparent border border-amber-600/30' :
                'bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {index === 0 ? <Crown className="w-5 h-5 text-yellow-400" /> :
                 index === 1 ? <Medal className="w-5 h-5 text-gray-300" /> :
                 index === 2 ? <Medal className="w-5 h-5 text-amber-600" /> :
                 <span className="text-white/40 text-sm font-bold">{entry.rank}</span>}
              </div>

              {/* Name */}
              <div>
                <div className="text-white font-semibold text-sm">{entry.name}</div>
                <div className="text-white/30 text-xs">{entry.avatar}</div>
              </div>

              {/* Newbucks */}
              <div className="text-right">
                <span className="text-yellow-400 font-bold text-sm">${entry.newbucks.toLocaleString()}</span>
              </div>

              {/* Plorts */}
              <div className="text-right text-white/60 text-sm">
                {entry.plortsSold.toLocaleString()}
              </div>

              {/* Days */}
              <div className="text-right text-white/60 text-sm flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3" />
                {entry.days}
              </div>
            </div>
          ))}
        </div>

        {/* Stats summary */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Global Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                ${(SAMPLE_LEADERBOARD.reduce((s, e) => s + e.newbucks, 0)).toLocaleString()}
              </div>
              <div className="text-white/40 text-xs">Total Newbucks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">
                {(SAMPLE_LEADERBOARD.reduce((s, e) => s + e.plortsSold, 0)).toLocaleString()}
              </div>
              <div className="text-white/40 text-xs">Total Plorts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {(SAMPLE_LEADERBOARD.reduce((s, e) => s + e.slimesFed, 0)).toLocaleString()}
              </div>
              <div className="text-white/40 text-xs">Slimes Fed</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-all hover:scale-[1.02]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
