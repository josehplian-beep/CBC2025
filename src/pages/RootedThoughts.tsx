import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RootedThoughtsFeed from '@/components/RootedThoughtsFeed';
import MessageSectionSelect from '@/components/MessageSectionSelect';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function RootedThoughts() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Rooted Thoughts | Chin Bethel Church</title><meta name="description" content="Daily devotional reflections from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="container mx-auto max-w-7xl px-4 pb-20 pt-28 md:pt-32">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-6 border-b border-border pb-8">
        <MessageSectionSelect value="/rooted-thoughts" />
        {can('manage_testimonies') && <Button asChild variant="outline"><Link to="/admin/rooted-thoughts"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>}
      </header>
      <RootedThoughtsFeed />
    </main>
    <Footer />
  </div>;
}