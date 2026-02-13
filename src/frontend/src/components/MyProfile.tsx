import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGetCallerUserProfile, useUpdateProfile, useGetMyConnections, useGetCoachPhoto, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { Edit, Save, X, Upload, MapPin } from 'lucide-react';
import AdminBadge from './AdminBadge';
import { useImageBlobUrl } from '../utils/imageBlobUrl';

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

export default function MyProfile() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const { data: connections = [] } = useGetMyConnections();
  const { data: storedPhoto, isLoading: photoLoading } = useGetCoachPhoto(identity?.getPrincipal() || null);
  const { data: isAdmin = false } = useIsCallerAdmin();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
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

  // Use the image blob URL hook for stored photo
  const storedPhotoUrl = useImageBlobUrl(storedPhoto);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, []);

  const startEditing = () => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio);
      setExperience(Number(profile.experience).toString());
      setSpecialty(profile.specialty);
      setCertifications(profile.certifications.join(', '));
      setLocation(profile.location);
      setPositionsCoached(profile.positionsCoached);
      setCoachingRoles(profile.coachingRoles);
      
      // Clear any existing preview
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setPhotoBlob(null);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPhotoBlob(null);
    
    // Revoke blob URL if it was created during editing
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setShowPositionDropdown(false);
    setShowRoleDropdown(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old preview URL if it's a blob URL
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

  const handleSave = async () => {
    if (!profile || !identity) return;

    let photoExtBlob: ExternalBlob | undefined = profile.photo;
    if (photoBlob) {
      const arrayBuffer = await photoBlob.arrayBuffer();
      photoExtBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    }

    const certList = certifications
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    await updateProfile.mutateAsync({
      name: name.trim(),
      bio: bio.trim(),
      experience: BigInt(parseInt(experience) || 0),
      specialty: specialty.trim(),
      certifications: certList,
      photo: photoExtBlob,
      positionsCoached,
      location: location.trim(),
      coachingRoles,
      userId: identity.getPrincipal(),
    });

    setIsEditing(false);
    setPhotoBlob(null);
    
    // Revoke blob URL after save
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setShowPositionDropdown(false);
    setShowRoleDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Profile not found</CardContent>
      </Card>
    );
  }

  // Determine which photo to display
  const displayPhotoUrl = isEditing && photoPreview 
    ? photoPreview 
    : storedPhotoUrl.url;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>My Profile</CardTitle>
                {isAdmin && <AdminBadge />}
              </div>
              <CardDescription>Manage your coaching profile and information</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={startEditing}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEditing}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateProfile.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfile.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-2 border-border">
                    {displayPhotoUrl ? (
                      <AvatarImage 
                        src={displayPhotoUrl} 
                        alt="Profile" 
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-muted">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <Label htmlFor="photo-edit" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Photo
                    </span>
                  </Button>
                  <Input
                    id="photo-edit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </Label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-edit">Full Name</Label>
                  <Input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio-edit">Bio</Label>
                  <Textarea
                    id="bio-edit"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your coaching background and philosophy..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience-edit">Years of Experience</Label>
                  <Input
                    id="experience-edit"
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty-edit">Coaching Specialty</Label>
                  <Input id="specialty-edit" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-edit">Location</Label>
                  <Input
                    id="location-edit"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., University of Texas, Dallas Cowboys, Austin, TX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Coaching Roles</Label>
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
                  <Label>Positions Coached</Label>
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
                  <Label htmlFor="certifications-edit">Certifications (comma-separated)</Label>
                  <Textarea
                    id="certifications-edit"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-2 border-border">
                    {storedPhotoUrl.isLoading ? (
                      <AvatarFallback className="text-3xl bg-muted">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </AvatarFallback>
                    ) : displayPhotoUrl ? (
                      <AvatarImage 
                        src={displayPhotoUrl} 
                        alt={profile.name}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-muted">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    {isAdmin && <AdminBadge />}
                  </div>
                  <p className="text-muted-foreground">{profile.specialty}</p>
                  {profile.location && (
                    <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="mb-2 font-semibold">Bio</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Experience</h3>
                  <p className="text-sm text-muted-foreground">{Number(profile.experience)} years</p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Connections</h3>
                  <p className="text-sm text-muted-foreground">{connections.length} coaches</p>
                </div>
              </div>

              {profile.coachingRoles.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Coaching Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.coachingRoles.map((role) => (
                      <Badge key={role} variant="default">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.positionsCoached.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Positions Coached</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.positionsCoached.map((position) => (
                      <Badge key={position} variant="secondary">
                        {position}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.certifications.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Certifications</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {profile.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
