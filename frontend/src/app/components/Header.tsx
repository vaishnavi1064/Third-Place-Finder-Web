import { User, MapPin, Star, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isGuest, isLoggedIn } = useAuth();

  const displayName = isGuest ? 'Guest' : (user?.username || 'User');
  const initials = isGuest ? 'G' : displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 relative z-20">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Third Place Finder
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Discover your community spaces
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle and User Profile */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 hover:scale-105 transition-all shadow-lg hover:shadow-xl cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className={`text-white text-sm ${isGuest ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                    {displayName}
                  </span>
                  {isGuest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hidden sm:block">
                      Guest
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200 dark:border-slate-700">
                <DropdownMenuLabel>
                  {isGuest ? 'Guest Mode' : `@${user?.username}`}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isGuest && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Star className="mr-2 h-4 w-4" />
                      Saved Places
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isGuest && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/login')}>
                      <User className="mr-2 h-4 w-4" />
                      Sign up to save favorites
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium hover:from-violet-600 hover:to-blue-600 transition-all shadow-lg"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
