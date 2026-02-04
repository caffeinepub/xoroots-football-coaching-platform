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
    <div className="container py-8 bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="feed" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="coaches" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Coaches</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <SocialFeed />
        </TabsContent>

        <TabsContent value="coaches" className="space-y-6">
          <CoachDirectory />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <JobBoard />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <MessagingHub />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <MyProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
}
