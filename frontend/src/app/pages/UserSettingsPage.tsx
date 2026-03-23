import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Bell, MapPin, Heart, Settings, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function UserSettingsPage() {
  const navigate = useNavigate();
  const [user] = useState({
    name: 'Alex Chen',
    email: 'alex@example.com',
    avatar: '',
  });

  const [favorites] = useState([
    { id: 1, name: 'Cozy Coffee Shop', type: 'Cafe', distance: '0.3 mi' },
    { id: 3, name: 'Central Park', type: 'Park', distance: '1.2 mi' },
  ]);

  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </button>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-slate-700/60 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-blue-500 p-8 text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-white/30">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-white/20 text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
                <p className="text-white/80 text-sm mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    defaultValue={user.name}
                    className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">
                    Default Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="New York, NY"
                    className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <Button className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600">
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-4">
              {favorites.length > 0 ? (
                <div className="space-y-3">
                  {favorites.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {place.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {place.type} • {place.distance}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No favorite places yet</p>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        Notifications
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Receive updates about nearby places
                      </p>
                    </div>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        Location Sharing
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Allow app to access your location
                      </p>
                    </div>
                  </div>
                  <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style>{`
        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
}
