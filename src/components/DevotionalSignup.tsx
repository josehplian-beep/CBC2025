import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const emailSchema = z.string().trim().email().max(255);

export default function DevotionalSignup() {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { toast.error('Please enter a valid email address.'); return; }
    setSaving(true);
    const { error } = await supabase.from('devotional_subscribers').insert({ email: parsed.data.toLowerCase() });
    setSaving(false);
    if (error && error.code !== '23505') { toast.error('Could not sign you up. Please try again.'); return; }
    setDone(true);
  };

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 text-center backdrop-blur sm:p-8">
      <Mail className="mx-auto mb-3 h-8 w-8 text-primary" />
      <h2 className="font-display text-xl font-semibold sm:text-2xl">Get Rooted Thoughts in your inbox</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Receive each new devotional by email. Unsubscribe anytime.</p>
      {done ? (
        <p className="mt-5 font-medium text-primary">Thank you! You're on the list.</p>
      ) : (
        <form onSubmit={subscribe} className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row">
          <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
          <Button type="submit" disabled={saving}>{saving ? 'Signing up…' : 'Subscribe'}</Button>
        </form>
      )}
    </section>
  );
}
