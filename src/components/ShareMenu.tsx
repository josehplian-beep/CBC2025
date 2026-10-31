import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SharePanel from '@/components/SharePanel';

type ShareMenuProps = {
  url: string;
  title: string;
  text: string;
};

export default function ShareMenu({ url, title, text }: ShareMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full"><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] rounded-2xl p-5">
        <p className="mb-4 font-display text-base font-semibold">Share this post</p>
        <SharePanel url={url} title={title} text={text} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
