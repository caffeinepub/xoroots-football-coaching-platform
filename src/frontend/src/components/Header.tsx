import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCoachPhoto, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import AdminBadge from './AdminBadge';
import { useImageBlobUrl } from '../utils/imageBlobUrl';
import BrandLogo from './BrandLogo';

export default function Header() {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: photo } = useGetCoachPhoto(identity?.getPrincipal() || null);
  const { data: isAdmin = false } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const photoUrl = useImageBlobUrl(photo);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-20 items-center px-4 md:px-6">
        <div className="flex items-center gap-3 mr-auto">
          <BrandLogo size="small" />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-10 w-10 rounded-lg hover:bg-primary/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated && profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-primary/50 transition-all">
                  <Avatar className="h-11 w-11">
                    {photoUrl.url && (
                      <AvatarImage src={photoUrl.url} alt={profile.name} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="flex items-center justify-start gap-3 p-3">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold leading-none">{profile.name || 'User'}</p>
                      {isAdmin && <AdminBadge />}
                    </div>
                    <p className="text-sm leading-none text-muted-foreground font-medium">
                      {profile.specialty || 'Coach'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer p-3">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
