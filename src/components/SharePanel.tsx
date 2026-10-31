import { useState } from 'react';
import { Check, Facebook, Instagram, Link2, Linkedin, Mail, MessageCircle, MessageSquare, Send, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SharePanelProps = {
  url: string;
  title: string;
  text: string;
  className?: string;
  onDone?: () => void;
};

const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}

function openWindow(href: string) {
  const popup = window.open(href, '_blank', 'noopener,noreferrer,width=640,height=600');
  if (!popup) window.location.href = href;
}

export default function SharePanel({ url, title, text, className, onDone }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const link = encodeURIComponent(url);
  const message = encodeURIComponent(`${text}\n${url}`);

  const copyLink = async (note?: string) => {
    if (await writeClipboard(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(note ?? 'Link copied');
    } else {
      toast.error('Could not copy. Press and hold the link below to copy it.');
    }
  };

  const nativeShare = (fallbackNote?: string) => {
    navigator.share({ title, text, url }).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) copyLink(fallbackNote);
    });
  };

  const options = [
    {
      label: 'Facebook',
      icon: Facebook,
      run: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${link}`),
    },
    {
      label: 'Messenger',
      icon: MessageCircle,
      run: () => isMobile()
        ? (window.location.href = `fb-messenger://share/?link=${link}`)
        : copyLink('Link copied — paste it into a Messenger chat').then(() => openWindow('https://www.messenger.com/')),
    },
    {
      label: 'Instagram',
      icon: Instagram,
      // Instagram has no link-share URL; the phone's share sheet lists the Instagram app.
      run: () => canNativeShare() && isMobile()
        ? nativeShare('Link copied — paste it into Instagram')
        : copyLink('Link copied — paste it into your Instagram story, bio, or DM'),
    },
    {
      label: 'Telegram',
      icon: Send,
      run: () => openWindow(`https://t.me/share/url?url=${link}&text=${encodeURIComponent(text)}`),
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      run: () => openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${link}`),
    },
    {
      label: 'Text',
      icon: MessageSquare,
      run: () => { window.location.href = `sms:?&body=${message}`; },
    },
    {
      label: 'Email',
      icon: Mail,
      run: () => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${message}`; },
    },
    {
      label: copied ? 'Copied' : 'Copy link',
      icon: copied ? Check : Link2,
      run: () => copyLink(),
    },
  ];

  const [expanded, setExpanded] = useState(false);
  const primary = options.filter((o) => ['Facebook', 'Messenger', 'Instagram'].includes(o.label));
  const extra = options.filter((o) => !primary.includes(o) && !o.label.startsWith('Cop'));
  const copyOption = options[options.length - 1];
  const visible = expanded ? [...primary, ...extra] : primary;

  const iconButton = ({ label, icon: Icon, run }: (typeof options)[number]) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      onClick={() => { run(); onDone?.(); }}
      className="group flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-secondary/60 text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {visible.map(iconButton)}
        <button
          type="button"
          onClick={() => (canNativeShare() && isMobile() ? nativeShare() : setExpanded((v) => !v))}
          aria-label="More share options"
          title="More"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Share2 className="h-[18px] w-[18px]" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => copyOption.run()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
