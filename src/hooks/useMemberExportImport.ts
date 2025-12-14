import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  baptized: boolean | null;
  position: string | null;
  department: string | null;
  service_year: string | null;
  family_id: string | null;
  families?: { family_name: string } | null;
}

interface Family {
  id: string;
  family_name: string;
  street_address: string;
  street_address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
}

export const useMemberExportImport = () => {
  const { toast } = useToast();

  const parseAddress = (address: string | null) => {
    if (!address) return { street: '', line2: '', city: '', state: '', zip: '' };
    
    if (address.includes('|||')) {
      const parts = address.split('|||');
      return {
        street: parts[0] || '',
        line2: parts[1] || '',
        city: parts[2] || '',
        state: parts[3] || '',
        zip: parts[4] || ''
      };
    }
    
    // Old comma format
    const parts = address.split(',').map(p => p.trim());
    return {
      street: parts[0] || '',
      line2: '',
      city: parts[1] || '',
      state: parts[2] || '',
      zip: parts[3] || ''
    };
  };

  const exportMembers = async (members: Member[], families: Family[]) => {
    try {
      // Load custom fields
      const { data: customFields } = await supabase
        .from('member_custom_fields')
        .select('*')
        .order('display_order');

      // Load all custom field values
      const { data: customValues } = await supabase
        .from('member_custom_field_values')
        .select('*');

      // Load tag assignments
      const { data: tagAssignments } = await supabase
        .from('member_tag_assignments')
        .select('member_id, member_tags(name)');

      // Create a map of member_id to tags
      const memberTagsMap: Record<string, string[]> = {};
      tagAssignments?.forEach(ta => {
        if (!memberTagsMap[ta.member_id]) memberTagsMap[ta.member_id] = [];
        if (ta.member_tags) memberTagsMap[ta.member_id].push((ta.member_tags as { name: string }).name);
      });

      // Create values map
      const valuesMap: Record<string, Record<string, string>> = {};
      customValues?.forEach(cv => {
        if (!valuesMap[cv.member_id]) valuesMap[cv.member_id] = {};
        valuesMap[cv.member_id][cv.field_id] = cv.value || '';
      });

      // Build export data
      const exportData = members.map(member => {
        const family = families.find(f => f.id === member.family_id);
        
        // Prioritize family address, fallback to member address
        let street = '';
        let line2 = '';
        let city = '';
        let state = '';
        let zip = '';
        
        if (family && (family.street_address || family.city || family.state || family.postal_code)) {
          street = family.street_address || '';
          line2 = family.street_address_line2 || '';
          city = family.city || '';
          state = family.state || '';
          zip = family.postal_code || '';
        } else {
          const addr = parseAddress(member.address);
          street = addr.street;
          line2 = addr.line2;
          city = addr.city;
          state = addr.state;
          zip = addr.zip;
        }
        
        const row: Record<string, string | boolean | null> = {
          'Name': member.name,
          'Email': member.email || '',
          'Gender': member.gender || '',
          'Baptized': member.baptized ? 'Yes' : member.baptized === false ? 'No' : '',
          'Phone': member.phone || '',
          'Street Address': street,
          'Apt/Unit': line2,
          'City': city,
          'State': state,
          'Zip Code': zip,
          'Date of Birth': member.date_of_birth || '',
          'Position': member.position || '',
          'Department': member.department || '',
          'Service Year': member.service_year || '',
          'Group By Family': family?.family_name || '',
          'Tags': memberTagsMap[member.id]?.join(', ') || ''
        };

        // Add custom fields
        customFields?.forEach(field => {
          row[field.name] = valuesMap[member.id]?.[field.id] || '';
        });

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Members');
      
      const fileName = `members_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Success",
        description: `Exported ${members.length} members to ${fileName}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const downloadTemplate = async () => {
    try {
      // Load custom fields for template
      const { data: customFields } = await supabase
        .from('member_custom_fields')
        .select('name')
        .order('display_order');

      const headers = [
        'Name', 'Email', 'Gender', 'Baptized', 'Phone',
        'Street Address', 'Apt/Unit', 'City', 'State', 'Zip Code',
        'Date of Birth', 'Position', 'Department', 'Service Year',
        'Group By Family', 'Tags'
      ];

      // Add custom fields to headers
      customFields?.forEach(field => headers.push(field.name));

      // Create template with headers and one example row
      const templateData = [
        headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {}),
        {
          'Name': 'John Doe',
          'Email': 'john@example.com',
          'Gender': 'Male',
          'Baptized': 'Yes',
          'Phone': '123-4567890',
          'Street Address': '123 Main St',
          'Apt/Unit': 'Apt 1',
          'City': 'Anytown',
          'State': 'MD',
          'Zip Code': '12345',
          'Date of Birth': '1990-01-15',
          'Position': 'Member',
          'Department': '',
          'Service Year': '2024',
          'Group By Family': 'Doe Family',
          'Tags': 'Volunteer, Youth'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData.slice(1), { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      XLSX.writeFile(wb, 'member_import_template.xlsx');

      toast({
        title: "Success",
        description: "Template downloaded successfully"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return { exportMembers, downloadTemplate };
};
