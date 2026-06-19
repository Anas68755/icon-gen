import { useState, useEffect, useRef } from 'react';
import { Play, Settings, HelpCircle, Trophy, ChevronRight } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  onLeaderboard: () => void;
}

interface FloatingSlime {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  phase: number;
}

export default function MainMenu({ onPlay, onSettings, onHowToPlay, onLeaderboard }: MainMenuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [titleLoaded, setTitleLoaded] = useState(false);
  const slimesRef = useRef<FloatingSlime[]>([]);
  const animRef = useRef<number>(0);

  // Initialize floating background slimes
  useEffect(() => {
    const colors = ['#FF69B4', '#A0A0A0', '#808080', '#40E0D0', '#DAA520', '#FF4500'];
    const slimes: FloatingSlime[] = [];
    for (let i = 0; i < 20; i++) {
      slimes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        radius: 15 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    slimesRef.current = slimes;

    // Title image preload
    const img = new Image();
    img.onload = () => setTitleLoaded(true);
    img.src = '/assets/ui/title_logo.png';
  }, []);

  // Animate background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1a1a3e');
      grad.addColorStop(0.5, '#2d1b69');
      grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137.5 + time * 0.01) % canvas.width;
        const sy = (i * 97.3) % (canvas.height * 0.6);
        const twinkle = 0.3 + Math.sin(time * 0.002 + i) * 0.3;
        ctx.globalAlpha = twinkle;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Ground
      ctx.fillStyle = '#1a472a';
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      // Fence posts
      ctx.fillStyle = '#8B6914';
      for (let i = 0; i < canvas.width; i += 80) {
        ctx.fillRect(i, canvas.height * 0.68, 8, 30);
        ctx.fillRect(i + 4, canvas.height * 0.7, 76, 3);
        ctx.fillRect(i + 4, canvas.height * 0.72, 76, 3);
      }

      // Floating slimes
      for (const slime of slimesRef.current) {
        slime.x += slime.vx * 0.016;
        slime.y += slime.vy * 0.016;
        slime.phase += 0.03;

        // Bounce off edges
        if (slime.x < slime.radius || slime.x > canvas.width - slime.radius) slime.vx *= -1;
        if (slime.y < slime.radius || slime.y > canvas.height - slime.radius) slime.vy *= -1;

        const scaleY = 1 + Math.sin(slime.phase) * 0.1;
        const scaleX = 1 - Math.sin(slime.phase) * 0.05;

        ctx.save();
        ctx.translate(slime.x, slime.y);
        ctx.scale(scaleX, scaleY);

        // Glow
        ctx.shadowColor = slime.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(0, 0, slime.radius, 0, Math.PI * 2);
        ctx.fillStyle = slime.color + 'CC';
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-slime.radius * 0.3, -slime.radius * 0.15, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(slime.radius * 0.3, -slime.radius * 0.15, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(0, slime.radius * 0.1, 4, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Title Logo */}
        <div className="mb-8">
          {titleLoaded ? (
            <img
              src="/assets/ui/title_logo.png"
              alt="Slime Rancher"
              className="w-[400px] md:w-[500px] drop-shadow-2xl animate-bounce-slow"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}
            />
          ) : (
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-2xl">
              SLIME RANCHER
            </h1>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-white/60 text-lg mb-10 font-medium">
          Far, Far Range Adventure
        </p>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <button
            onClick={onPlay}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-2xl text-white font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
          >
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Play
            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={onHowToPlay}
            className="group flex items-center justify-center gap-3 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl text-white font-semibold border border-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200"
          >
            <HelpCircle className="w-5 h-5 text-blue-400" />
            How to Play
          </button>

          <button
            onClick={onLeaderboard}
            className="group flex items-center justify-center gap-3 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl text-white font-semibold border border-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </button>

          <button
            onClick={onSettings}
            className="group flex items-center justify-center gap-3 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl text-white font-semibold border border-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            Settings
          </button>
        </div>

        {/* Version */}
        <p className="absolute bottom-4 text-white/20 text-xs">
          v1.0 - Far, Far Range
        </p>
      </div>
    </div>
  );
}
