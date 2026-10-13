import { Link } from 'react-router-dom';
import { ArrowLeft, PenLine } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RootedThoughtsFeed from '@/components/RootedThoughtsFeed';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function RootedThoughts() {
  const { can } = usePermissions();
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet><title>Rooted Thoughts | Chin Bethel Church</title><meta name="description" content="Daily devotional reflections from Chin Bethel Church." /></Helmet>
    <Navigation />
    <main className="container mx-auto max-w-7xl px-4 pb-20 pt-28 md:pt-32">
      <Link to="/testimony" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Messages</Link>
      <header className="mb-12 mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div><p className="mb-3 text-sm font-medium text-primary">Daily devotions</p><h1 className="font-display text-4xl font-bold md:text-5xl">Rooted Thoughts</h1>
          <p className="mt-4 text-lg text-muted-foreground">Growing in faith, one reflection at a time.</p></div>
        {can('manage_testimonies') && <Button asChild variant="outline"><Link to="/admin/rooted-thoughts"><PenLine className="mr-2 h-4 w-4" />Manage posts</Link></Button>}
      </header>
      <RootedThoughtsFeed />
    </main>
    <Footer />
  </div>;
}