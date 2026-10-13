import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { messageSections, type MessageSectionPath } from '@/lib/message-sections';

export default function MessageSectionSelect({ value }: { value: MessageSectionPath }) {
  const navigate = useNavigate();

  return <h1 className="min-w-0">
    <Select value={value} onValueChange={path => navigate(path)}>
      <SelectTrigger aria-label="Message section" className="h-auto w-full gap-4 border-0 bg-transparent px-0 py-2 text-left font-display text-3xl font-bold shadow-none sm:w-auto md:text-4xl [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {messageSections.map(section => <SelectItem key={section.path} value={section.path} className="py-3 text-base">{section.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </h1>;
}