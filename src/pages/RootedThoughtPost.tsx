import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Copy, Facebook, PenLine, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TextSizeControl from '@/components/TextSizeControl';
import PostEngagement from '@/components/PostEngagement';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { excerpt, postMetadata } from '@/lib/rooted-thoughts';

export default function RootedThoughtPost({ embed = false }: { embed?: boolean }) {
  const { slug } = useParams();
  useEffect(() => {
    const homepageImages = Array.from(document.head.querySelectorAll('meta[property="og:image"]:not([data-rh]), meta[name="twitter:image"]:not([data-rh])'));
    homepageImages.forEach(tag => tag.remove());
    return () => { homepageImages.forEach(tag => document.head.appendChild(tag)); };
  }, []);
  const [scale, setScale] = useState(1);
  const { can } = usePermissions();
  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooted-thought', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      let query = supabase.from('testimonials').select('*').eq('content_type', 'rooted_thought').eq('is_published', true);
      query = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(slug || '') ? query.eq('id', slug || '') : query.eq('slug', slug || '');
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); }
    catch { toast.error('Could not copy. Select and copy the text instead.'); }
  };
  const metadata = post ? postMetadata(post) : null;
  const url = metadata?.url || '';
  const share = async () => {
    if (!post) return;
    if (!navigator.share) { await copy(url); return; }
    try { await navigator.share({ title: post.title, text: excerpt(post.content), url }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast.error('Sharing is unavailable. Copy the link instead.'); }
  };

  return <div className="min-h-screen bg-background text-foreground">
    {!embed && <Navigation />}
    <main className={`mx-auto max-w-4xl px-5 pb-16 ${embed ? 'pt-6' : 'pt-28 md:pt-32'}`}>
      {!embed && <Link to="/rooted-thoughts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Rooted Thoughts</Link>}
      {isLoading ? <div className="space-y-6 py-10"><Skeleton className="h-12 w-3/4" /><Skeleton className="aspect-video w-full" /><Skeleton className="h-24 w-full" /></div>
        : isError ? <div role="alert" className="py-16"><h1 className="text-2xl font-semibold">Unable to load this reflection</h1><Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button></div>
        : !post ? <div className="py-16"><h1 className="font-display text-3xl font-bold">Post not found</h1><p className="mt-4 text-muted-foreground">This reflection is unavailable or has not been published.</p></div>
        : <>
          <Helmet>
            <title>{post.title} | Rooted Thoughts</title><meta name="description" content={excerpt(post.content)} />
            <link rel="canonical" href={url} /><meta property="og:title" content={post.title} />
            <meta property="og:description" content={excerpt(post.content)} /><meta property="og:type" content="article" />
            <meta property="og:url" content={url} /><meta name="twitter:card" content={metadata?.image ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={post.title} /><meta name="twitter:description" content={excerpt(post.content)} />
            <meta property="article:published_time" content={post.created_at} />
            <meta property="og:image" content={metadata?.image || ''} /><meta name="twitter:image" content={metadata?.image || ''} />
            {metadata?.image && <meta property="og:image:alt" content={post.title} />}
          </Helmet>
          <article className="mt-8">
            <p className="mb-4 text-sm font-medium text-primary">Rooted Thoughts · Daily devotion</p>
            <h1 className="break-words font-display text-3xl font-bold leading-tight md:text-5xl">{post.title}</h1>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>{post.author_name}</span><time dateTime={post.created_at}>{format(new Date(post.created_at), 'MMMM d, yyyy')}</time></div>
            {!embed && <div className="my-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
              <TextSizeControl scale={scale} onChange={setScale} />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={share}><Share2 className="mr-2 h-4 w-4" />Share</Button>
                <Button variant="ghost" size="icon" aria-label="Copy post link" title="Copy post link" onClick={() => copy(url)}><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" asChild><a aria-label="Share on Facebook" title="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /></a></Button>
                {can('manage_testimonies') && <Button variant="ghost" size="sm" asChild><Link to={`/admin/rooted-thoughts?edit=${post.id}`}><PenLine className="mr-2 h-4 w-4" />Edit</Link></Button>}
              </div>
            </div>}
            {post.image_url && <img src={post.image_url} alt={post.title} onContextMenu={event => event.preventDefault()} draggable={false} className="my-8 h-auto w-full rounded-lg" />}
            {post.author_role && <p className="mb-8 border-l-2 border-primary pl-5 text-lg font-medium">{post.author_role}</p>}
            <div className="space-y-6 break-words leading-relaxed" style={{ fontSize: `${scale * 1.125}rem` }}>
              {(embed ? excerpt(post.content, 350) : post.content).split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
            </div>
          </article>
          {embed ? <Button asChild className="mt-8"><a href={url} target="_blank" rel="noopener noreferrer">Read the full reflection</a></Button> : <PostEngagement postId={post.id} />}
        </>}
    </main>
    {!embed && <Footer />}
  </div>;
}