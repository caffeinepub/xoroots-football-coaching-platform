import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetJobPostings, usePostJob, useApplyForJob, useDeleteJobPosting, useGetMyApplications, useGetAllProfiles, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Briefcase, Plus, Trash2, CheckCircle, MapPin, Building2, DollarSign, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { JobPost } from '../backend';
import AdminBadge from './AdminBadge';

export default function JobBoard() {
  const { identity } = useInternetIdentity();
  const { data: jobs = [], isLoading } = useGetJobPostings();
  const { data: myApplications = [] } = useGetMyApplications();
  const { data: profiles = [] } = useGetAllProfiles();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const postJob = usePostJob();
  const applyForJob = useApplyForJob();
  const deleteJobPosting = useDeleteJobPosting();

  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);

  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [schoolOrOrganization, setSchoolOrOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [compensation, setCompensation] = useState('');
  const [requirements, setRequirements] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const getProfileByPrincipal = (principalId: string) => {
    return profiles.find((p) => p.userId.toString() === principalId);
  };

  const hasApplied = (jobId: string) => {
    return myApplications.some(([id]) => id === jobId);
  };

  const isJobPoster = (posterId: string) => {
    return identity?.getPrincipal().toString() === posterId;
  };

  const isPosterAdmin = (posterId: string) => {
    return isAdmin && identity?.getPrincipal().toString() === posterId;
  };

  const resetForm = () => {
    setJobTitle('');
    setRole('');
    setLevel('');
    setSchoolOrOrganization('');
    setLocation('');
    setCompensation('');
    setRequirements('');
    setAdditionalInfo('');
  };

  const handlePostJob = async () => {
    if (!jobTitle.trim() || !role.trim() || !level.trim() || !schoolOrOrganization.trim() || !location.trim() || !requirements.trim()) {
      return;
    }

    await postJob.mutateAsync({
      title: jobTitle,
      role,
      level,
      schoolOrOrganization,
      location,
      compensation: compensation.trim() || null,
      requirements,
      additionalInfo,
    });
    resetForm();
    setShowPostDialog(false);
  };

  const handleApply = async () => {
    if (!selectedJob || !coverLetter.trim()) return;

    await applyForJob.mutateAsync({ jobId: selectedJob.id, coverLetter });
    setCoverLetter('');
    setShowApplyDialog(false);
    setSelectedJob(null);
  };

  const handleDelete = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      deleteJobPosting.mutate(jobId);
    }
  };

  const handleViewDetails = (job: JobPost) => {
    setSelectedJob(job);
    setShowDetailsDialog(true);
  };

  const sortedJobs = [...jobs].sort((a, b) => Number(b.timestamp - a.timestamp));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Board</CardTitle>
              <CardDescription>Find coaching opportunities or post openings</CardDescription>
            </div>
            <Button onClick={() => setShowPostDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Post Job
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {sortedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No job postings yet. Be the first to post an opportunity!
            </CardContent>
          </Card>
        ) : (
          sortedJobs.map((job) => {
            const poster = getProfileByPrincipal(job.poster.toString());
            const applied = hasApplied(job.id);
            const isPoster = isJobPoster(job.poster.toString());
            const posterIsAdmin = isPosterAdmin(job.poster.toString());

            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <CardDescription>
                          Posted by {poster?.name || 'Coach'}
                        </CardDescription>
                        {posterIsAdmin && <AdminBadge className="text-xs" />}
                        <CardDescription>
                          • {formatDistanceToNow(Number(job.timestamp) / 1000000, { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    {(isPoster || isAdmin) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    {job.role && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium">Role:</span>
                        <span>{job.role}</span>
                      </div>
                    )}
                    {job.level && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary">{job.level}</Badge>
                      </div>
                    )}
                    {job.schoolOrOrganization && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{job.schoolOrOrganization}</span>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.compensation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.compensation}</span>
                      </div>
                    )}
                  </div>

                  {job.requirements && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Requirements:</p>
                      <p className="text-muted-foreground line-clamp-2">{job.requirements}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{job.applications.length} applications</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleViewDetails(job)}>
                      View Details
                    </Button>
                    {!isPoster && (
                      <Button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowApplyDialog(true);
                        }}
                        disabled={applied}
                        variant={applied ? 'secondary' : 'default'}
                      >
                        {applied ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Applied
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Post Job Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-foreground dark:text-white border-2 border-border shadow-2xl backdrop-blur-none">
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-white">Post a Job Opening</DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-gray-400">Share a coaching opportunity with the community</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-foreground dark:text-white">Job Title *</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Youth Academy Head Coach"
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground dark:text-white">Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700">
                  <SelectItem value="Head Coach">Head Coach</SelectItem>
                  <SelectItem value="Offensive Coordinator">Offensive Coordinator</SelectItem>
                  <SelectItem value="Defensive Coordinator">Defensive Coordinator</SelectItem>
                  <SelectItem value="Special Teams Coordinator">Special Teams Coordinator</SelectItem>
                  <SelectItem value="Strength and Conditioning Coach">Strength and Conditioning Coach</SelectItem>
                  <SelectItem value="Position Coach">Position Coach</SelectItem>
                  <SelectItem value="Assistant Coach">Assistant Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level" className="text-foreground dark:text-white">Level *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level" className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700">
                  <SelectItem value="Youth">Youth</SelectItem>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Semi-Professional">Semi-Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school" className="text-foreground dark:text-white">School/Organization *</Label>
              <Input
                id="school"
                value={schoolOrOrganization}
                onChange={(e) => setSchoolOrOrganization(e.target.value)}
                placeholder="e.g., Lincoln High School"
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground dark:text-white">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Dallas, TX"
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation" className="text-foreground dark:text-white">Compensation (Optional)</Label>
              <Input
                id="compensation"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="e.g., $50,000 - $60,000 per year"
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements" className="text-foreground dark:text-white">Requirements *</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List the qualifications, experience, and skills required for this position..."
                rows={5}
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info" className="text-foreground dark:text-white">Additional Information</Label>
              <Textarea
                id="additional-info"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any additional details about the position, team, or organization..."
                rows={4}
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePostJob} disabled={postJob.isPending}>
                {postJob.isPending ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-foreground dark:text-white border-2 border-border shadow-2xl backdrop-blur-none">
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-white">{selectedJob?.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <DialogDescription className="text-muted-foreground dark:text-gray-400">
                Posted by {getProfileByPrincipal(selectedJob?.poster.toString() || '')?.name || 'Coach'}
              </DialogDescription>
              {selectedJob && isPosterAdmin(selectedJob.poster.toString()) && <AdminBadge className="text-xs" />}
              <DialogDescription className="text-muted-foreground dark:text-gray-400">
                • {selectedJob && formatDistanceToNow(Number(selectedJob.timestamp) / 1000000, { addSuffix: true })}
              </DialogDescription>
            </div>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {selectedJob.role && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-1">Role</h3>
                    <p className="text-base text-foreground dark:text-white">{selectedJob.role}</p>
                  </div>
                )}
                {selectedJob.level && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-1">Level</h3>
                    <Badge variant="secondary">{selectedJob.level}</Badge>
                  </div>
                )}
                {selectedJob.schoolOrOrganization && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-1">School/Organization</h3>
                    <p className="text-base text-foreground dark:text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedJob.schoolOrOrganization}
                    </p>
                  </div>
                )}
                {selectedJob.location && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-1">Location</h3>
                    <p className="text-base text-foreground dark:text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedJob.location}
                    </p>
                  </div>
                )}
                {selectedJob.compensation && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-1">Compensation</h3>
                    <p className="text-base text-foreground dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {selectedJob.compensation}
                    </p>
                  </div>
                )}
              </div>

              {selectedJob.requirements && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-2">Requirements</h3>
                  <p className="text-base text-foreground dark:text-white whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.additionalInfo && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground dark:text-gray-400 mb-2">Additional Information</h3>
                  <p className="text-base text-foreground dark:text-white whitespace-pre-wrap">{selectedJob.additionalInfo}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border dark:border-gray-700">
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {selectedJob.applications.length} {selectedJob.applications.length === 1 ? 'application' : 'applications'} received
                </p>
              </div>

              {!isJobPoster(selectedJob.poster.toString()) && (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowApplyDialog(true);
                    }}
                    disabled={hasApplied(selectedJob.id)}
                    variant={hasApplied(selectedJob.id) ? 'secondary' : 'default'}
                  >
                    {hasApplied(selectedJob.id) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Applied
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 text-foreground dark:text-white border-2 border-border shadow-2xl backdrop-blur-none">
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-white">Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-gray-400">Submit your application with a cover letter</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover-letter" className="text-foreground dark:text-white">Cover Letter *</Label>
              <Textarea
                id="cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you're a great fit for this position..."
                rows={8}
                className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={applyForJob.isPending}>
                {applyForJob.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
