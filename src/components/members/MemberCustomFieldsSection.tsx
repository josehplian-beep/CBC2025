import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings } from "lucide-react";

interface CustomField {
  id: string;
  name: string;
  field_type: string;
  options: { choices?: string[] } | null;
  is_required: boolean;
}

interface FieldValue {
  id?: string;
  field_id: string;
  value: string | null;
}

interface MemberCustomFieldsSectionProps {
  memberId: string;
  canEdit: boolean;
}

export const MemberCustomFieldsSection = ({ memberId, canEdit }: MemberCustomFieldsSectionProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFieldsAndValues();
  }, [memberId]);

  const loadFieldsAndValues = async () => {
    // Load fields
    const { data: fieldsData } = await supabase
      .from('member_custom_fields')
      .select('*')
      .order('display_order');

    if (fieldsData) {
      setFields(fieldsData as CustomField[]);
    }

    // Load values
    const { data: valuesData } = await supabase
      .from('member_custom_field_values')
      .select('*')
      .eq('member_id', memberId);

    if (valuesData) {
      const valuesMap: Record<string, string> = {};
      valuesData.forEach((v: FieldValue) => {
        valuesMap[v.field_id] = v.value || '';
      });
      setValues(valuesMap);
      setOriginalValues(valuesMap);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Find changed values
      const changedFields = fields.filter(field => values[field.id] !== originalValues[field.id]);

      for (const field of changedFields) {
        const value = values[field.id] || null;
        
        // Check if value exists
        const { data: existing } = await supabase
          .from('member_custom_field_values')
          .select('id')
          .eq('member_id', memberId)
          .eq('field_id', field.id)
          .single();

        if (existing) {
          await supabase
            .from('member_custom_field_values')
            .update({ value })
            .eq('id', existing.id);
        } else if (value) {
          await supabase
            .from('member_custom_field_values')
            .insert({ member_id: memberId, field_id: field.id, value });
        }
      }

      setOriginalValues({ ...values });
      toast({ title: "Success", description: "Custom fields saved" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(values) !== JSON.stringify(originalValues);

  const renderField = (field: CustomField) => {
    const value = values[field.id] || '';

    switch (field.field_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field.id}`}
              checked={value === 'true'}
              onCheckedChange={(checked) => setValues({ ...values, [field.id]: checked ? 'true' : 'false' })}
              disabled={!canEdit}
            />
            <Label htmlFor={`field-${field.id}`}>{value === 'true' ? 'Yes' : 'No'}</Label>
          </div>
        );
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(v) => setValues({ ...values, [field.id]: v })}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.choices?.map((choice) => (
                <SelectItem key={choice} value={choice}>{choice}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            disabled={!canEdit}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            disabled={!canEdit}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            disabled={!canEdit}
          />
        );
    }
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Additional Information
        </CardTitle>
        {canEdit && hasChanges && (
          <Button onClick={handleSave} disabled={loading} size="sm">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <Label className="text-sm font-medium">{field.name}</Label>
              {renderField(field)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
