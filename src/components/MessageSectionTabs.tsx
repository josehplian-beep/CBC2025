import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { messageSections, type MessageSectionPath } from '@/lib/message-sections';

export default function MessageSectionTabs({ value }: { value: MessageSectionPath }) {
  const navigate = useNavigate();
  const goTo = (path: string) => navigate(path);

  return (
    <Tabs value={value} onValueChange={goTo} className="w-full md:w-56 md:shrink-0">
      {/* Mobile dropdown */}
      <div className="md:hidden">
        <Select value={value} onValueChange={goTo}>
          <SelectTrigger aria-label="Message section" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {messageSections.map(section => (
              <SelectItem key={section.path} value={section.path}>{section.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop vertical tab sidebar, styled after the department tabs */}
      <TabsList className="hidden md:flex md:flex-col w-full gap-1.5 h-auto bg-muted/50 p-2 rounded-xl md:sticky md:top-24 self-start">
        {messageSections.map(section => (
          <TabsTrigger
            key={section.path}
            value={section.path}
            className="w-full justify-start px-4 py-2.5 rounded-lg text-left font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground"
          >
            {section.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
