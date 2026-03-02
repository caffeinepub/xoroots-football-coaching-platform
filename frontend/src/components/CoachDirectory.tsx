import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGetAllProfiles, useGetCoachCount, useIsCallerAdmin, useFollowCoach, useUnfollowCoach, useIsFollowing, useDeleteUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Search, UserPlus, UserCheck, MapPin, Users, UserX } from 'lucide-react';
import type { CoachProfile } from '../backend';
import { Principal } from '@dfinity/principal';
import AdminBadge from './AdminBadge';
import CoachProfileDetailModal from './CoachProfileDetailModal';

export default function CoachDirectory() {
  const { identity } = useInternetIdentity();
  const { data: profiles = [], isLoading } = useGetAllProfiles();
  const { data: coachCount = 0, isLoading: isLoadingCount } = useGetCoachCount();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const followCoach = useFollowCoach();
  const unfollowCoach = useUnfollowCoach();
  const deleteUser = useDeleteUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<Principal | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<Principal | null>(null);

  const filteredProfiles = profiles.filter((profile) => {
    const query = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.specialty.toLowerCase().includes(query) ||
      profile.location.toLowerCase().includes(query) ||
      profile.positionsCoached.some((pos) => pos.toLowerCase().includes(query)) ||
      profile.coachingRoles.some((role) => role.toLowerCase().includes(query)) ||
      profile.certifications.some((cert) => cert.toLowerCase().includes(query))
    );
  });

  const isCurrentUser = (userId: string) => {
    return identity?.getPrincipal().toString() === userId;
  };

  const isProfileAdmin = (userId: string) => {
    return isAdmin && identity?.getPrincipal().toString() === userId;
  };

  const handleFollowToggle = (profile: CoachProfile, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowCoach.mutate(profile.userId);
    } else {
      followCoach.mutate(profile.userId);
    }
  };

  const handleDeleteAccount = () => {
    if (!deleteTargetId) return;
    deleteUser.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Coach Directory</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="text-lg font-semibold">
                  {isLoadingCount ? '...' : `${coachCount} Members`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, specialty, location, role, position, or certification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => {
            const isMe = isCurrentUser(profile.userId.toString());
            const profileIsAdmin = isProfileAdmin(profile.userId.toString());

            return (
              <CoachCard
                key={profile.userId.toString()}
                profile={profile}
                isMe={isMe}
                profileIsAdmin={profileIsAdmin}
                isAdmin={isAdmin}
                onViewProfile={() => setSelectedCoachId(profile.userId)}
                onFollowToggle={handleFollowToggle}
                onDeleteAccount={() => setDeleteTargetId(profile.userId)}
              />
            );
          })}
        </div>

        {filteredProfiles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No coaches found matching your search.
            </CardContent>
          </Card>
        )}

        <CoachProfileDetailModal
          coachId={selectedCoachId}
          onClose={() => setSelectedCoachId(null)}
        />
      </div>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-border dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground dark:text-white">Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-gray-400">
              Are you sure you want to delete this user account? This action cannot be undone. All of their posts, job listings, and profile data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface CoachCardProps {
  profile: CoachProfile;
  isMe: boolean;
  profileIsAdmin: boolean;
  isAdmin: boolean;
  onViewProfile: () => void;
  onFollowToggle: (profile: CoachProfile, isFollowing: boolean) => void;
  onDeleteAccount: () => void;
}

function CoachCard({ profile, isMe, profileIsAdmin, isAdmin, onViewProfile, onFollowToggle, onDeleteAccount }: CoachCardProps) {
  const { identity } = useInternetIdentity();
  const { data: isFollowing = false } = useIsFollowing(
    identity?.getPrincipal() || null,
    profile.userId
  );
  const followCoach = useFollowCoach();
  const unfollowCoach = useUnfollowCoach();

  const canDeleteAccount = isAdmin && !isMe && !profileIsAdmin;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <Avatar className="h-16 w-16">
            {profile.photo && <AvatarImage src={profile.photo.getDirectURL()} alt={profile.name} />}
            <AvatarFallback className="text-lg">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isMe && (
            <Button
              size="sm"
              variant={isFollowing ? 'secondary' : 'default'}
              onClick={() => onFollowToggle(profile, isFollowing)}
              disabled={followCoach.isPending || unfollowCoach.isPending}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="mr-1 h-3 w-3" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="mr-1 h-3 w-3" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewProfile}
              className="font-semibold hover:underline text-left"
            >
              {profile.name}
            </button>
            {profileIsAdmin && <AdminBadge className="text-xs" />}
          </div>
          <p className="text-sm text-muted-foreground">{profile.specialty}</p>
          {profile.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{Number(profile.experience)} years experience</span>
        </div>

        {profile.coachingRoles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.coachingRoles.slice(0, 2).map((role, idx) => (
              <Badge key={idx} variant="default" className="text-xs">
                {role}
              </Badge>
            ))}
            {profile.coachingRoles.length > 2 && (
              <Badge variant="default" className="text-xs">
                +{profile.coachingRoles.length - 2}
              </Badge>
            )}
          </div>
        )}

        {profile.positionsCoached.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.positionsCoached.slice(0, 2).map((position, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {position}
              </Badge>
            ))}
            {profile.positionsCoached.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{profile.positionsCoached.length - 2}
              </Badge>
            )}
          </div>
        )}

        {profile.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.certifications.slice(0, 2).map((cert, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cert}
              </Badge>
            ))}
            {profile.certifications.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.certifications.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
          {canDeleteAccount && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteAccount}
            >
              <UserX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
