import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count?: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card className={`${color} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          {count !== undefined && (
            <span className="bg-black/10 text-gray-700 text-sm py-0.5 px-2 rounded-full font-medium">
              {count}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={setNodeRef}
          className="h-[600px] rounded-md border border-dashed border-gray-300 p-3"
        >
          {children}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
