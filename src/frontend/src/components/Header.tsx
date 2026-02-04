import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetCallerUserProfile, useGetCoachPhoto, useIsCallerAdmin } from '../hooks/useQueries';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import AdminBadge from './AdminBadge';

export default function Header() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userPhoto, isLoading: photoLoading } = useGetCoachPhoto(
    identity && !identity.getPrincipal().isAnonymous() ? identity.getPrincipal() : null
  );
  const { data: isAdmin = false } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const disabled = loginStatus === 'logging-in' || isInitializing;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      // Clear all cached data on logout
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        // Handle the case where user is already authenticated
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/assets/Untitled design (40).png" alt="XOROOTS logo" className="h-10 w-auto" />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <div className="relative h-10 w-10">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      {photoLoading ? (
                        <AvatarFallback className="bg-muted">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </AvatarFallback>
                      ) : userPhoto ? (
                        <AvatarImage 
                          src={userPhoto.getDirectURL()} 
                          alt={userProfile.name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-muted">
                          {userProfile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                      {isAdmin && <AdminBadge className="text-xs" />}
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.specialty}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAuth}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleAuth} disabled={disabled}>
              {disabled ? 'Logging in...' : 'Login'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
