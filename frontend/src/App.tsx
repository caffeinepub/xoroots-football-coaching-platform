import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminBanner from './components/AdminBanner';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import AuthenticatedScrollingLogoBackground from './components/AuthenticatedScrollingLogoBackground';
import { useEffect, useState, useRef } from 'react';

const PROFILE_LOADING_TIMEOUT = 10000; // 10 seconds max wait

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, refetch } = useGetCallerUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Handle profile setup modal visibility with timeout safeguard
  useEffect(() => {
    if (!isAuthenticated) {
      setShowProfileSetup(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Wait for profile data to be fetched
    if (profileLoading || !isFetched) {
      // Set timeout to prevent infinite loading
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          console.warn('[Profile Setup] Timeout reached - hiding setup modal');
          setShowProfileSetup(false);
        }, PROFILE_LOADING_TIMEOUT);
      }
      return;
    }

    // Clear timeout once data is fetched
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Show profile setup if user has no name
    if (userProfile && !userProfile.name) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, userProfile, profileLoading, isFetched]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleProfileSetupComplete = async () => {
    setShowProfileSetup(false);
    await refetch();
  };

  // Show minimal loading screen only during initial session restoration
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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        {isAuthenticated && <Header />}
        {isAuthenticated && <AdminBanner />}
        <main className="flex-1 relative">
          {isAuthenticated && <AuthenticatedScrollingLogoBackground />}
          <div className="relative z-10">
            {isAuthenticated ? <Dashboard /> : <LandingPage />}
          </div>
        </main>
        <Footer />
        <Toaster />
        {showProfileSetup && (
          <ProfileSetupModal
            isOpen={showProfileSetup}
            onComplete={handleProfileSetupComplete}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
