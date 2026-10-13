import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { excerpt, postPath } from '@/lib/rooted-thoughts';

export default function RecentTopic() {
  const { data: latest, isLoading } = useQuery({
    queryKey: ['recent-rooted-thought'],
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonials')
        .select('id,title,content,slug,created_at,image_url')
        .eq('content_type', 'rooted_thought').eq('is_published', true)
        .order('created_at', { ascending: false }).order('id').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <Skeleton className="mb-12 h-64 w-full rounded-lg" />;
  if (!latest) return null;

  return (
    <section aria-labelledby="recent-topic" className="mb-12">
      <h2 id="recent-topic" className="mb-6 text-center text-2xl font-display font-semibold sm:text-3xl">Recent Topic</h2>
      <Link to={postPath(latest)} className="group grid gap-6 border-y border-border py-7 outline-offset-4 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-2 sm:items-center sm:gap-10">
        {latest.image_url && <div className="aspect-[3/2] overflow-hidden rounded-lg bg-muted"><img src={latest.image_url} alt={latest.title} loading="lazy" decoding="async" onContextMenu={event => event.preventDefault()} draggable={false} className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" /></div>}
        <div className={latest.image_url ? '' : 'sm:col-span-2'}>
            <p className="text-sm text-muted-foreground">{new Date(latest.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h3 className="mt-2 text-2xl font-display font-bold transition-colors group-hover:text-primary md:text-3xl">{latest.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{excerpt(latest.content, 240)}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 font-medium text-primary">Read reflection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </Link>
    </section>
  );
}
