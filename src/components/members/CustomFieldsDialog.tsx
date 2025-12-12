import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface CustomField {
  id: string;
  name: string;
  field_type: string;
  options: { choices?: string[] } | null;
  is_required: boolean;
  display_order: number;
}

interface CustomFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldsUpdated: () => void;
}

export const CustomFieldsDialog = ({ open, onOpenChange, onFieldsUpdated }: CustomFieldsDialogProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFields();
    }
  }, [open]);

  const loadFields = async () => {
    const { data, error } = await supabase
      .from('member_custom_fields')
      .select('*')
      .order('display_order');
    
    if (!error && data) {
      setFields(data as CustomField[]);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;

    setLoading(true);
    try {
      const options = newFieldType === 'select' && newFieldOptions
        ? { choices: newFieldOptions.split(',').map(s => s.trim()) }
        : null;

      const { error } = await supabase
        .from('member_custom_fields')
        .insert({
          name: newFieldName.trim(),
          field_type: newFieldType,
          options,
          display_order: fields.length
        });

      if (error) throw error;

      toast({ title: "Success", description: "Custom field created successfully" });
      setNewFieldName("");
      setNewFieldType("text");
      setNewFieldOptions("");
      loadFields();
      onFieldsUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field? All member data for this field will be lost.")) return;

    try {
      const { error } = await supabase
        .from('member_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({ title: "Success", description: "Field deleted successfully" });
      loadFields();
      onFieldsUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Custom Fields</DialogTitle>
          <DialogDescription>Create custom fields to store additional member information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="font-semibold">Add New Field</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Field name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger>
                  <SelectValue placeholder="Field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFieldType === 'select' && (
              <Input
                placeholder="Options (comma-separated)"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
              />
            )}
            <Button onClick={handleAddField} disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Field
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Existing Fields</Label>
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No custom fields created yet</p>
              ) : (
                fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{field.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {field.field_type}
                          {field.options?.choices && ` (${field.options.choices.join(', ')})`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
