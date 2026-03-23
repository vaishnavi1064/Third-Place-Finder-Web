import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { Button } from './ui/button';

type TimerMode = 'work' | 'break';

export function PomodoroTimer() {
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto switch modes when timer completes
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('work');
        setTimeLeft(WORK_TIME);
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? WORK_TIME : BREAK_TIME);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'work' ? WORK_TIME : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="relative p-5 overflow-hidden min-h-fit max-h-full">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-slate-50 dark:from-violet-900/10 dark:via-blue-900/10 dark:to-slate-900/10" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-200/20 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Glass Panel */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col">
          <h2 className="font-semibold mb-4 text-slate-900 dark:text-slate-100 tracking-tight">Pomodoro Timer</h2>
          
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {/* Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'work' ? 'default' : 'outline'}
                onClick={() => switchMode('work')}
                className="flex-1 transition-all h-8 text-xs gap-1"
                style={{
                  boxShadow: mode === 'work' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Zap className="h-3 w-3" />
                Focus
              </Button>
              <Button
                variant={mode === 'break' ? 'default' : 'outline'}
                onClick={() => switchMode('break')}
                className="flex-1 transition-all h-8 text-xs gap-1"
                style={{
                  boxShadow: mode === 'break' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Coffee className="h-3 w-3" />
                Break
              </Button>
            </div>

            {/* 3D Timer Display */}
            <div 
              className="relative"
              style={{ perspective: '800px' }}
            >
              <div 
                className="text-center p-3 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-700/80 dark:to-gray-700/40 backdrop-blur-sm rounded-2xl shadow-lg border border-white/90 dark:border-gray-600/60"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isRunning ? 'rotateX(1deg) rotateY(1deg)' : 'rotateX(0deg) rotateY(0deg)',
                }}
              >
                <div 
                  className="text-3xl font-mono font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent"
                  style={{
                    transform: 'translateZ(10px)',
                  }}
                >
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-1 mt-1">
                  {mode === 'work' ? (
                    <><Zap className="h-2.5 w-2.5" />Focus Time</>
                  ) : (
                    <><Coffee className="h-2.5 w-2.5" />Break Time</>
                  )}
                </p>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="relative h-16 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="32"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="6"
                  className="dark:stroke-gray-700/30"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="32"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.4))',
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                onClick={toggleTimer}
                className="flex-1 transition-all hover:scale-105 hover:shadow-lg"
                variant="default"
                style={{
                  background: isRunning 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                }}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button 
                onClick={resetTimer} 
                variant="outline" 
                size="icon"
                className="transition-all hover:scale-110 hover:rotate-180 duration-500"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
}