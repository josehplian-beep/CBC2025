import { BookOpen } from 'lucide-react';

export default function MessagesHero() {
  return (
    <header className="relative overflow-hidden bg-hero-gradient pt-32 pb-24 md:pt-40 md:pb-28 text-center text-primary-foreground">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      <div className="container relative mx-auto px-4">
        <BookOpen className="mx-auto mb-6 h-16 w-16" strokeWidth={1.75} />
        <h1 className="font-display text-5xl font-bold md:text-7xl">Messages</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl">
          Sermons, teachings, and messages that inspire and transform lives
        </p>
      </div>
    </header>
  );
}
