import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useInitializeCallerProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminBanner from './components/AdminBanner';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { useEffect, useState, useRef } from 'react';
import { useActor } from './hooks/useActor';

const PROFILE_LOADING_TIMEOUT = 10000; // 10 seconds max wait

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched, refetch } = useGetCallerUserProfile();
  const initializeProfile = useInitializeCallerProfile();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const profileCheckAttemptedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      profileCheckAttemptedRef.current = false;
      setIsLoadingProfile(false);
      setProfileReady(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isAuthenticated]);

  // Streamlined profile loading with timeout safeguard
  useEffect(() => {
    const loadProfile = async () => {
      // Only run once per login session
      if (profileCheckAttemptedRef.current) {
        return;
      }

      // Wait for actor and authentication
      if (!actor || actorFetching || !isAuthenticated) {
        return;
      }

      // Wait for initial profile fetch
      if (profileLoading || !isFetched) {
        return;
      }

      console.log('[Profile Loading] Starting streamlined profile check...');
      profileCheckAttemptedRef.current = true;
      setIsLoadingProfile(true);

      // Set timeout safeguard to prevent indefinite loading
      timeoutRef.current = setTimeout(() => {
        console.warn('[Profile Loading] Timeout reached - showing dashboard anyway');
        setProfileReady(true);
        setIsLoadingProfile(false);
      }, PROFILE_LOADING_TIMEOUT);

      try {
        // Check if profile exists
        if (userProfile !== null && userProfile !== undefined) {
          console.log('[Profile Loading] ✓ Existing profile found');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setProfileReady(true);
          setIsLoadingProfile(false);
          return;
        }

        // No profile exists - initialize it
        console.log('[Profile Loading] No profile found, initializing...');
        const initializedProfile = await initializeProfile.mutateAsync();

        if (initializedProfile) {
          console.log('[Profile Loading] ✓ Profile initialized successfully');
          // Brief wait for backend commit
          await new Promise(resolve => setTimeout(resolve, 500));
          await refetch();
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setProfileReady(true);
        setIsLoadingProfile(false);
        console.log('[Profile Loading] ✓ Profile ready - showing dashboard');
      } catch (error) {
        console.error('[Profile Loading] Error during profile loading:', error);
        // Even on error, show dashboard after timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setProfileReady(true);
        setIsLoadingProfile(false);
      }
    };

    loadProfile();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isAuthenticated, actor, actorFetching, userProfile, profileLoading, isFetched, initializeProfile, refetch]);

  // Show loading screen during initial session restoration
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Restoring session...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show loading only while profile is being checked/initialized
  if (isAuthenticated && !profileReady && isLoadingProfile) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md px-4">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Loading your page...</h2>
            <p className="text-sm text-muted-foreground">
              Setting up your profile...
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <AdminBanner />
        <main className="flex-1">
          {isAuthenticated ? <Dashboard /> : <LandingPage />}
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
