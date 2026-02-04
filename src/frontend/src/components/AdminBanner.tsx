import { useEffect } from 'react';
import { useIsCallerAdmin, useHasNewBannerNotification, useDismissBannerNotification } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export default function AdminBanner() {
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: hasNotification = false, refetch } = useHasNewBannerNotification();
  const dismissBanner = useDismissBannerNotification();

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, refetch]);

  const handleDismiss = async () => {
    await dismissBanner.mutateAsync();
  };

  // Only show banner to admins with new notifications
  if (!isAdmin || !hasNotification) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 animate-in slide-in-from-top duration-300">
      <div className="container py-2">
        <Alert className="border-primary bg-primary/10 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="font-medium text-primary">
              ⚠️ New report submitted. Review now.
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={dismissBanner.isPending}
              className="h-6 w-6 text-primary hover:bg-primary/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
