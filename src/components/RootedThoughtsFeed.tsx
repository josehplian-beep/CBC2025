import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { excerpt, postPath } from '@/lib/rooted-thoughts';

type MessageFeedProps = {
  contentType?: 'rooted_thought' | 'testimony';
  preview?: boolean;
};

export default function RootedThoughtsFeed({ contentType = 'rooted_thought', preview = false }: MessageFeedProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = preview ? 4 : 12;
  const isTestimony = contentType === 'testimony';
  const label = isTestimony ? 'testimonies' : 'Rooted Thoughts';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['message-feed', contentType, page, search, preview],
    queryFn: async () => {
      let query = supabase.from('testimonials')
        .select('id,title,content,author_name,author_role,image_url,created_at,slug', { count: 'exact' })
        .eq('content_type', contentType).eq('is_published', true)
        .order('created_at', { ascending: false }).order('id')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (search.trim()) {
        const term = `%${search.trim().replace(/[%,()]/g, '')}%`;
        query = query.or(`title.ilike.${term},author_name.ilike.${term}`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { posts: data, count: count || 0 };
    },
  });

  const linkFor = (post: { id: string; slug: string | null }) =>
    isTestimony ? `/testimony/${post.id}` : postPath(post);

  return <div className="min-w-0">
    {!preview && <div className="relative mx-auto mb-8 max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input aria-label={`Search ${label}`} placeholder={`Search by title or author…`} className="pl-10" value={search}
        onChange={event => { setSearch(event.target.value); setPage(0); }} />
    </div>}
    {isLoading ? <div className="grid gap-8">
      {Array.from({ length: preview ? 2 : 4 }, (_, index) => <div key={index} className="space-y-4">
        <Skeleton className="aspect-[3/2] w-full rounded-lg" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" />
      </div>)}
    </div> : isError ? <div role="alert" className="py-12 text-muted-foreground">
      <p>{isTestimony ? 'Testimonies' : 'Rooted Thoughts'} could not be loaded.</p><Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button>
    </div> : !data?.posts.length ? <div className="border-y border-border py-16 text-center">
      <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="font-display text-xl font-semibold">{search ? 'No posts found' : 'A new chapter is coming'}</h3>
      <p className="mt-3 text-muted-foreground">{search ? 'Try another title or author name.' : isTestimony ? 'Testimonies will appear here when published.' : 'Daily reflections will appear here when published.'}</p>
    </div> : <>
      <div className="grid gap-8">
        {data.posts.map((post, index) => <article key={post.id} className="group min-w-0 border-b border-border pb-8">
          <Link to={linkFor(post)} className={`grid gap-6 rounded-lg outline-offset-4 focus-visible:ring-2 focus-visible:ring-ring ${preview ? '' : 'sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8'}`}>
            {post.image_url && <div className="aspect-[3/2] overflow-hidden rounded-lg bg-muted">
              <img src={post.image_url} alt={post.title} loading={index === 0 ? 'eager' : 'lazy'} decoding="async"
                onContextMenu={event => event.preventDefault()} draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
            </div>}
            <div className={post.image_url || preview ? 'min-w-0' : 'min-w-0 sm:col-span-2'}>
            <time dateTime={post.created_at} className="text-sm text-muted-foreground">{format(new Date(post.created_at), 'MMMM d, yyyy')}</time>
            <h3 className="mt-3 break-words font-display text-2xl font-semibold leading-snug group-hover:text-primary">{post.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{post.author_name}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{excerpt(post.content)}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read <ArrowRight className="h-4 w-4" /></span>
            </div>
          </Link>
        </article>)}
      </div>
      {!preview && data.count > pageSize && <div className="mt-10 flex items-center justify-center gap-6">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">{page + 1} / {Math.ceil(data.count / pageSize)}</span>
        <Button variant="outline" disabled={(page + 1) * pageSize >= data.count} onClick={() => setPage(page + 1)}>Next</Button>
      </div>}
    </>}
  </div>;
}
