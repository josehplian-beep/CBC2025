import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { messageSections, type MessageSectionPath } from '@/lib/message-sections';

export default function MessageSectionTabs({ value }: { value: MessageSectionPath }) {
  const navigate = useNavigate();

  return (
    <Tabs value={value} onValueChange={path => navigate(path)} className="flex w-full justify-center">
      <TabsList aria-label="Message section" className="h-auto gap-1.5 rounded-full border border-border/60 bg-muted/50 p-1.5 shadow-lg backdrop-blur-sm">
        {messageSections.map(section => (
          <TabsTrigger
            key={section.path}
            value={section.path}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring sm:px-7 sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground"
          >
            {section.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
