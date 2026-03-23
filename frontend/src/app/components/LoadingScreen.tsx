import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30 dark:from-slate-950 dark:via-violet-950/30 dark:to-blue-950/30 animate-fadeOut">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-300/30 dark:bg-violet-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/30 dark:bg-blue-500/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo Container with Glass Effect */}
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 animate-pulse-ring">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 blur-xl" />
          </div>
          
          {/* Glass Card */}
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/60 dark:border-slate-700/60 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg animate-bounce-gentle">
              <MapPin className="h-8 w-8 text-white animate-pulse-slow" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Third Place Finder
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 tracking-wide">
            Discovering your community spaces
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2 animate-fade-in-delayed">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 animate-bounce-dot" />
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-bounce-dot-delayed-1" />
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-bounce-dot-delayed-2" />
        </div>
      </div>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeInUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes bounceDot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-fadeOut {
          animation: fadeOut 2.5s ease-in-out forwards;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .animate-fade-in-delayed {
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .animate-pulse-ring {
          animation: pulseRing 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounceGentle 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        .animate-bounce-dot {
          animation: bounceDot 1.4s ease-in-out infinite;
        }

        .animate-bounce-dot-delayed-1 {
          animation: bounceDot 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }

        .animate-bounce-dot-delayed-2 {
          animation: bounceDot 1.4s ease-in-out infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
