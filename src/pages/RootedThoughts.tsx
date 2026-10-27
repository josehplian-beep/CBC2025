import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RootedThoughtsFeed from '@/components/RootedThoughtsFeed';
import MessageSectionTabs from '@/components/MessageSectionTabs';
import RecentTopic from "@/components/RecentTopic";
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import MessagesHero from '@/components/MessagesHero';
import DevotionalSignup from '@/components/DevotionalSignup';

export default function RootedThoughts() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Rooted Thoughts | Chin Bethel Church</title><meta name="description" content="Daily devotional reflections from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="pb-20">
      <MessagesHero />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-8 sm:px-8 sm:pt-10">
        <MessageSectionTabs value="/rooted-thoughts" />
        <div className="min-w-0 flex-1">
          {can('write_posts') && (
            <div className="mb-8 flex justify-end">
              <Button asChild variant="outline"><Link to="/admin/rooted-thoughts"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>
            </div>
          )}
          <RecentTopic />
          <h2 className="mb-6 text-center font-display text-2xl font-semibold sm:text-3xl">Latest Posts</h2>
          <RootedThoughtsFeed />
          <div className="mt-12"><DevotionalSignup /></div>
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
