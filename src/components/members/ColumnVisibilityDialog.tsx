import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

interface ColumnVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const ColumnVisibilityDialog = ({
  open,
  onOpenChange,
  columns,
  onColumnsChange
}: ColumnVisibilityDialogProps) => {
  const handleToggle = (key: string) => {
    onColumnsChange(
      columns.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSelectAll = () => {
    onColumnsChange(columns.map(col => ({ ...col, visible: true })));
  };

  const handleDeselectAll = () => {
    onColumnsChange(columns.map(col => ({ ...col, visible: false })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Column Visibility</DialogTitle>
          <DialogDescription>Choose which columns to display in the table.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
          <Button variant="outline" size="sm" onClick={handleDeselectAll}>Deselect All</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`col-${column.key}`}
                checked={column.visible}
                onCheckedChange={() => handleToggle(column.key)}
              />
              <Label htmlFor={`col-${column.key}`} className="text-sm cursor-pointer">
                {column.label}
              </Label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
