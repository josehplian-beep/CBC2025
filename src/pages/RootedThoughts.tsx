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
import communityImage from '@/assets/community.jpg';

export default function RootedThoughts() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Rooted Thoughts | Chin Bethel Church</title><meta name="description" content="Daily devotional reflections from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="pb-20 pt-16 md:pt-20">
      <header className="relative isolate flex min-h-[280px] items-center justify-center overflow-hidden px-5 py-20 sm:min-h-[340px]">
        <img src={communityImage} alt="" fetchPriority="high" onContextMenu={event => event.preventDefault()} draggable={false} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="message-banner-overlay absolute inset-0 -z-10" />
        <div className="text-center text-primary-foreground">
          <p className="mb-4 text-sm font-medium uppercase">Chin Bethel Church</p>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">Rooted Thoughts</h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed sm:text-lg">Faith for the everyday. Reflections rooted in the Word.</p>
        </div>
      </header>
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-8 sm:px-8 sm:pt-10">
        <MessageSectionTabs value="/rooted-thoughts" />
        <div className="min-w-0 flex-1">
          {can('manage_testimonies') && (
            <div className="mb-8 flex justify-end">
              <Button asChild variant="outline"><Link to="/admin/rooted-thoughts"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>
            </div>
          )}
          <RecentTopic />
          <h2 className="mb-6 text-center font-display text-2xl font-semibold sm:text-3xl">Latest Posts</h2>
          <RootedThoughtsFeed />
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
