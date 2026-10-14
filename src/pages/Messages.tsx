import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RootedThoughtsFeed from '@/components/RootedThoughtsFeed';
import MessageSectionTabs from '@/components/MessageSectionTabs';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import MessagesHero from '@/components/MessagesHero';

export default function Messages() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Testimonies | Chin Bethel Church</title><meta name="description" content="Testimonies and messages from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="pb-20">
      <MessagesHero />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-8 sm:px-8 sm:pt-10">
        <MessageSectionTabs value="/testimony" />
        <div className="min-w-0 flex-1">
          {can('manage_testimonies') && (
            <div className="mb-8 flex justify-end">
              <Button asChild variant="outline"><Link to="/admin/messages"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>
            </div>
          )}
          <h2 className="mb-6 text-center font-display text-2xl font-semibold sm:text-3xl">Latest Posts</h2>
          <RootedThoughtsFeed contentType="testimony" />
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
