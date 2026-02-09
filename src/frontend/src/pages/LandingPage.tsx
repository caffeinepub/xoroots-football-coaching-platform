import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Users, BookOpen, MessageSquare, Briefcase, Network, Share2 } from 'lucide-react';

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();

  const features = [
    {
      icon: Users,
      title: 'Coach Profiles',
      description: 'Create your professional coaching profile and showcase your experience and certifications.',
    },
    {
      icon: BookOpen,
      title: 'Content Library',
      description: 'Upload and share playbooks, drills, and training videos with the coaching community.',
    },
    {
      icon: Share2,
      title: 'Social Feed',
      description: 'Share updates, engage with posts, and stay connected with fellow coaches.',
    },
    {
      icon: MessageSquare,
      title: 'Collaboration Tools',
      description: 'Direct messaging and group discussions to collaborate with other coaches.',
    },
    {
      icon: Network,
      title: 'Professional Network',
      description: 'Build your coaching network and discover mutual connections.',
    },
    {
      icon: Briefcase,
      title: 'Job Board',
      description: 'Find coaching opportunities and apply with your professional profile.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <img src="/assets/Untitled design (40).png" alt="XOROOTS logo" className="h-24 w-auto md:h-32" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Connect. Share. Grow.
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              The all-in-one platform for football coaches to build their network, share knowledge, and advance
              their careers.
            </p>
            <Button size="lg" onClick={login} disabled={loginStatus === 'logging-in'} className="text-lg px-8 py-6">
              {loginStatus === 'logging-in' ? 'Logging in...' : 'Get Started'}
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 opacity-20">
          <img
            src="/assets/20260205_0932_Image Generation_remix_01kgq6w5tfe2tbg4ztq3wvmcbv.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools designed specifically for football coaches
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Ready to Join?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of coaches already using XOROOTS to advance their careers.
            </p>
            <Button size="lg" onClick={login} disabled={loginStatus === 'logging-in'}>
              {loginStatus === 'logging-in' ? 'Logging in...' : 'Create Your Profile'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
