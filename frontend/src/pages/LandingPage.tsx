import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Users, BookOpen, MessageSquare, Briefcase, Network, Share2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-24 md:py-32 lg:py-40">
        <div className="container relative z-10 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-10 flex justify-center">
              <BrandLogo size="large" />
            </div>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Connect. Share. Grow.
            </h1>
            <p className="mb-10 text-xl text-muted-foreground md:text-2xl lg:text-3xl font-medium">
              The all-in-one platform for football coaches to build their network, share knowledge, and advance
              their careers.
            </p>
            <Button 
              size="lg" 
              onClick={login} 
              disabled={loginStatus === 'logging-in'} 
              className="text-lg px-10 py-7 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loginStatus === 'logging-in' ? 'Logging in...' : 'Get Started'}
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 opacity-10">
          <img
            src="/assets/20260205_0932_Image Generation_remix_01kgq6w5tfe2tbg4ztq3wvmcbv.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground md:text-2xl font-medium">
              Powerful tools designed specifically for football coaches
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 transition-all duration-300 hover:border-primary hover:shadow-2xl hover:scale-105 bg-card"
              >
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/20">
                    <feature.icon className="h-7 w-7 text-primary" strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-gradient-to-br from-primary/10 via-background to-primary/5 py-24 md:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Ready to Join?
            </h2>
            <p className="mb-10 text-xl text-muted-foreground md:text-2xl font-medium">
              Join thousands of coaches already using XOROOTS to advance their careers.
            </p>
            <Button 
              size="lg" 
              onClick={login} 
              disabled={loginStatus === 'logging-in'}
              className="text-lg px-10 py-7 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loginStatus === 'logging-in' ? 'Logging in...' : 'Create Your Profile'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
