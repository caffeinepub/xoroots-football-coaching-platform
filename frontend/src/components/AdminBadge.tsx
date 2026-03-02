import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface AdminBadgeProps {
  className?: string;
}

export default function AdminBadge({ className = '' }: AdminBadgeProps) {
  return (
    <Badge 
      variant="destructive" 
      className={`bg-red-600 hover:bg-red-700 text-white font-semibold ${className}`}
    >
      <Shield className="mr-1 h-3 w-3" />
      ADMIN
    </Badge>
  );
}
