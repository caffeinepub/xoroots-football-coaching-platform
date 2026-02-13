import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SocialFeed from '../components/SocialFeed';
import CoachDirectory from '../components/CoachDirectory';
import JobBoard from '../components/JobBoard';
import MessagingHub from '../components/MessagingHub';
import MyProfile from '../components/MyProfile';
import { Home, Users, Briefcase, MessageSquare, User } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid h-14 p-1.5 bg-muted/50 border-2 border-border/40">
            <TabsTrigger 
              value="feed" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coaches" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Coaches</span>
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all"
            >
              <Briefcase className="h-5 w-5" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-8">
            <SocialFeed />
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6 mt-8">
            <CoachDirectory />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-8">
            <JobBoard />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6 mt-8">
            <MessagingHub />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 mt-8">
            <MyProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
