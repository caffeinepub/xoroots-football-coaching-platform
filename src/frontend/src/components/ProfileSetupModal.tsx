import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveCallerUserProfile, useGetCoachPhoto } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FOOTBALL_POSITIONS = [
  'Quarterback',
  'Running Back',
  'Wide Receiver',
  'Tight End',
  'Offensive Line',
  'Defensive Line',
  'Linebacker',
  'Defensive Back',
  'Safety',
  'Cornerback',
  'Kicker',
  'Punter',
  'Long Snapper',
  'Special Teams',
];

const COACHING_ROLES = [
  'Head Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Special Teams Coordinator',
  'Strength and Conditioning Coach',
];

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [certifications, setCertifications] = useState('');
  const [location, setLocation] = useState('');
  const [positionsCoached, setPositionsCoached] = useState<string[]>([]);
  const [coachingRoles, setCoachingRoles] = useState<string[]>([]);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const saveProfile = useSaveCallerUserProfile();
  const { data: storedPhoto, isLoading: photoLoading } = useGetCoachPhoto(identity?.getPrincipal() || null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old preview URL if exists
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      
      setPhotoBlob(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const togglePosition = (position: string) => {
    if (positionsCoached.includes(position)) {
      setPositionsCoached(positionsCoached.filter((p) => p !== position));
    } else {
      setPositionsCoached([...positionsCoached, position]);
    }
  };

  const removePosition = (position: string) => {
    setPositionsCoached(positionsCoached.filter((p) => p !== position));
  };

  const toggleRole = (role: string) => {
    if (coachingRoles.includes(role)) {
      setCoachingRoles(coachingRoles.filter((r) => r !== role));
    } else {
      setCoachingRoles([...coachingRoles, role]);
    }
  };

  const removeRole = (role: string) => {
    setCoachingRoles(coachingRoles.filter((r) => r !== role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity || !name.trim() || !specialty.trim()) {
      return;
    }

    let photoExtBlob: ExternalBlob | undefined = undefined;
    if (photoBlob) {
      const arrayBuffer = await photoBlob.arrayBuffer();
      photoExtBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    }

    const certList = certifications
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    await saveProfile.mutateAsync({
      userId: identity.getPrincipal(),
      name: name.trim(),
      bio: bio.trim(),
      experience: BigInt(parseInt(experience) || 0),
      specialty: specialty.trim(),
      certifications: certList,
      photo: photoExtBlob,
      positionsCoached,
      location: location.trim(),
      coachingRoles,
    });
  };

  // Determine which photo to display
  const displayPhotoUrl = photoPreview || (!photoLoading && storedPhoto ? storedPhoto.getDirectURL() : null);

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-foreground dark:text-white border-2 border-border shadow-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,1)' }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-white">Welcome to XOROOTS!</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-gray-400">Let's set up your coaching profile to get started.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                {photoLoading ? (
                  <AvatarFallback className="bg-muted">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </AvatarFallback>
                ) : displayPhotoUrl ? (
                  <AvatarImage 
                    src={displayPhotoUrl} 
                    alt="Profile"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <Label htmlFor="photo" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Upload Photo</span>
              </Button>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground dark:text-white">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-foreground dark:text-white">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your coaching background and philosophy..."
              rows={3}
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-foreground dark:text-white">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="5"
              min="0"
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty" className="text-foreground dark:text-white">Coaching Specialty *</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Offensive Coordinator, Defensive Strategy"
              required
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground dark:text-white">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., University of Texas, Dallas Cowboys, Austin, TX"
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground dark:text-white">Coaching Roles</Label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              >
                {coachingRoles.length === 0 ? 'Select coaching roles...' : `${coachingRoles.length} role(s) selected`}
              </Button>
              {showRoleDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-md border-2 border-border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-lg">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {COACHING_ROLES.map((role) => (
                      <div
                        key={role}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-foreground dark:text-white"
                        onClick={() => toggleRole(role)}
                      >
                        <input
                          type="checkbox"
                          checked={coachingRoles.includes(role)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {coachingRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {coachingRoles.map((role) => (
                  <Badge key={role} variant="default" className="gap-1">
                    {role}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeRole(role)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground dark:text-white">Positions Coached</Label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setShowPositionDropdown(!showPositionDropdown)}
              >
                {positionsCoached.length === 0 ? 'Select positions...' : `${positionsCoached.length} position(s) selected`}
              </Button>
              {showPositionDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-md border-2 border-border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-lg">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {FOOTBALL_POSITIONS.map((position) => (
                      <div
                        key={position}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-foreground dark:text-white"
                        onClick={() => togglePosition(position)}
                      >
                        <input
                          type="checkbox"
                          checked={positionsCoached.includes(position)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {positionsCoached.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {positionsCoached.map((position) => (
                  <Badge key={position} variant="secondary" className="gap-1">
                    {position}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removePosition(position)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications" className="text-foreground dark:text-white">Certifications (comma-separated)</Label>
            <Textarea
              id="certifications"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="USA Football Certified, AFCA Member, NFLPA Certified"
              rows={3}
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
