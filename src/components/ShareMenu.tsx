import { Copy, Facebook, Instagram, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ShareMenuProps = {
  url: string;
  title: string;
  text: string;
};

const openShare = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

export default function ShareMenu({ url, title, text }: ShareMenuProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy. Select and copy the link instead.');
    }
  };

  const shareToInstagram = async () => {
    await copyLink();
    toast.info('Instagram has no web share link — paste the copied link into your story, bio, or DM.');
  };

  const shareNative = async () => {
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({ title, text, url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error('Sharing is unavailable. Copy the link instead.');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`)}>
          <Facebook className="mr-2 h-4 w-4" />Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToInstagram}>
          <Instagram className="mr-2 h-4 w-4" />Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`; }}>
          <Mail className="mr-2 h-4 w-4" />Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <Copy className="mr-2 h-4 w-4" />Copy link
        </DropdownMenuItem>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={shareNative}>
            <Share2 className="mr-2 h-4 w-4" />More options…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
