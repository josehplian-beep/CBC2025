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
        : openWindow(`https://www.facebook.com/dialog/send?link=${link}&app_id=966242223397117&redirect_uri=${link}`),
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

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-4 gap-3">
        {options.map(({ label, icon: Icon, run }) => (
          <button
            key={label}
            type="button"
            onClick={() => { run(); if (label !== 'Copy link' && label !== 'Copied') onDone?.(); }}
            className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-secondary/60 text-foreground transition-all group-hover:-translate-y-0.5 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-95">
              <Icon className="h-5 w-5" />
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1 pl-4 pr-1">
        <span className="flex-1 truncate text-xs text-muted-foreground select-all">{url}</span>
        <button
          type="button"
          onClick={() => copyLink()}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {canNativeShare() && (
        <button
          type="button"
          onClick={() => nativeShare()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border/60 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Share2 className="h-4 w-4" /> More apps on this device
        </button>
      )}
    </div>
  );
}
