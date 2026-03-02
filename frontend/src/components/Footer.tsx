import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname) 
    : 'xoroots-app';

  return (
    <footer className="border-t-2 border-border/40 bg-muted/30 mt-auto">
      <div className="container py-8 px-4">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            © {currentYear}. Built with{' '}
            <Heart className="h-4 w-4 fill-primary text-primary animate-pulse" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
