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

export default function RootedThoughts() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Rooted Thoughts | Chin Bethel Church</title><meta name="description" content="Daily devotional reflections from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="container mx-auto max-w-7xl px-4 pb-20 pt-28 md:pt-32">
      <div className="flex flex-col gap-8 md:gap-10">
        <MessageSectionTabs value="/rooted-thoughts" />
        <div className="min-w-0 flex-1">
          {can('manage_testimonies') && (
            <div className="mb-8 flex justify-end">
              <Button asChild variant="outline"><Link to="/admin/rooted-thoughts"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>
            </div>
          )}
          <RecentTopic />
          <RootedThoughtsFeed />
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
