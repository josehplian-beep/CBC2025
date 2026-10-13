import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { excerpt, postPath } from '@/lib/rooted-thoughts';

type Post = { id: string; title: string; content: string; slug: string | null; created_at: string; image_url: string | null };

export default function RecentTopic() {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    supabase.from('testimonials')
      .select('id,title,content,slug,created_at,image_url')
      .eq('content_type', 'rooted_thought').eq('is_published', true)
      .order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setPosts((data as Post[]) || []));
  }, []);

  if (posts && posts.length === 0) return null;
  const [latest, ...others] = posts || [];

  return (
    <section aria-labelledby="recent-topic" className="mb-12">
      <h2 id="recent-topic" className="mb-5 flex items-center gap-2 text-2xl font-display font-bold">
        <Sparkles className="h-6 w-6 text-primary" /> Recent Topic
      </h2>
      {!posts ? (
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Link to={postPath(latest)} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring lg:col-span-2">
            <p className="text-sm text-muted-foreground">{new Date(latest.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h3 className="mt-2 text-2xl font-display font-bold transition-colors group-hover:text-primary md:text-3xl">{latest.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{excerpt(latest.content, 240)}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 font-medium text-primary">Read reflection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <div className="grid gap-5">
            {others.map(post => (
              <Link key={post.id} to={postPath(post)} className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring">
                <h3 className="font-semibold transition-colors group-hover:text-primary">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{excerpt(post.content, 110)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
