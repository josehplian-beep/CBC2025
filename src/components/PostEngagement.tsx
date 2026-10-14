import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';

const TOKEN_KEY = 'cbc-visitor-token';

function visitorToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export default function PostEngagement({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canModerate = can('manage_testimonies');
  const [name, setName] = useState(() => localStorage.getItem('cbc-comment-name') || '');
  const [comment, setComment] = useState('');

  const { data: likes = [] } = useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_likes').select('visitor_token').eq('post_id', postId);
      if (error) throw error;
      return data;
    },
  });
  const liked = likes.some(like => like.visitor_token === visitorToken());

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (liked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('visitor_token', visitorToken());
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, visitor_token: visitorToken() });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-likes', postId] }),
    onError: () => toast.error('Could not save your like. Please try again.'),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_comments').select('id, author_name, content, created_at').eq('post_id', postId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_name: name.trim(), content: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      localStorage.setItem('cbc-comment-name', name.trim());
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Comment posted');
    },
    onError: () => toast.error('Could not post your comment. Please try again.'),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }),
    onError: () => toast.error('Could not delete the comment.'),
  });

  return <section className="mt-12 border-t border-border pt-8">
    <div className="flex items-center gap-4">
      <Button variant={liked ? 'default' : 'outline'} onClick={() => toggleLike.mutate()} disabled={toggleLike.isPending} aria-pressed={liked} aria-label={liked ? 'Unlike this post' : 'Like this post'}>
        <Heart className={`mr-2 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        {liked ? 'Liked' : 'Like'}
      </Button>
      <span className="text-sm text-muted-foreground">{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
    </div>

    <h2 className="mt-10 mb-4 flex items-center gap-2 font-display text-xl font-semibold">
      <MessageCircle className="h-5 w-5" />Comments{comments.length > 0 && ` (${comments.length})`}
    </h2>

    <form className="space-y-3" onSubmit={event => { event.preventDefault(); addComment.mutate(); }}>
      <Input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" maxLength={80} required aria-label="Your name" />
      <Textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Share your thoughts…" maxLength={2000} rows={3} required aria-label="Your comment" />
      <Button type="submit" disabled={addComment.isPending || !name.trim() || !comment.trim()}>
        <Send className="mr-2 h-4 w-4" />Post comment
      </Button>
    </form>

    <div className="mt-8 space-y-5">
      {isLoading ? <p className="text-sm text-muted-foreground">Loading comments…</p>
        : comments.length === 0 ? <p className="text-sm text-muted-foreground">Be the first to comment.</p>
        : comments.map(item => <div key={item.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{item.author_name}</p>
            <div className="flex items-center gap-2">
              <time dateTime={item.created_at} className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</time>
              {canModerate && <Button variant="ghost" size="icon" aria-label="Delete comment" onClick={() => deleteComment.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </div>
          </div>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed">{item.content}</p>
        </div>)}
    </div>
  </section>;
}
