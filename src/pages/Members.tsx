import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Mail, MapPin, Phone, User, AlertTriangle, Loader2, Download, Plus, Filter, Calendar, Users, Edit, Trash2, Upload, Eye, Search, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UpcomingBirthdays } from "@/components/UpcomingBirthdays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as XLSX from 'xlsx';

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

const getStateAbbreviation = (state: string | null | undefined): string => {
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();
  return STATE_ABBREVIATIONS[state] || state;
};



const familyFormSchema = z.object({
  family_name: z.string().min(1, "Family name is required").max(100, "Family name must be less than 100 characters")
});

const memberFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().max(100).optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  baptized: z.string().optional(),
  email: z.string().email("Invalid email address").max(255).optional().or(z.literal("")),
  area_code: z.string().regex(/^\d{3}$/, "Area code must be 3 digits").optional().or(z.literal("")),
  phone_number: z.string().regex(/^\d{7,10}$/, "Phone number must be 7-10 digits").optional().or(z.literal("")),
  family_id: z.string().optional().or(z.literal("")),
  street_address: z.string().max(200).optional().or(z.literal("")),
  street_address_line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  birth_month: z.string().optional().or(z.literal("")),
  birth_day: z.string().optional().or(z.literal("")),
  birth_year: z.string().optional().or(z.literal("")),
  position: z.string().max(100).optional().or(z.literal("")),
  department: z.string().max(100).optional().or(z.literal("")),
  service_year: z.string().max(50).optional().or(z.literal(""))
}).refine((data) => {
  // Validate birth date is a valid date if all fields are provided
  if (data.birth_month && data.birth_day && data.birth_year) {
    const month = parseInt(data.birth_month);
    const day = parseInt(data.birth_day);
    const year = parseInt(data.birth_year);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  return true;
}, {
  message: "Invalid birth date",
  path: ["birth_day"]
});

interface Family {
  id: string;
  family_name: string;
  street_address: string;
  street_address_line2: string | null;
  city: string;
  county: string;
  state: string;
  postal_code: string;
}

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  church_groups: string[] | null;
  gender: string | null;
  baptized: boolean | null;
  profile_image_url: string | null;
  position: string | null;
  department: string | null;
  service_year: string | null;
  family_id: string | null;
  families?: Family;
}

const Members = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [user, setUser] = useState(null);
  const { can, isAdministrator, isStaff } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [baptizedFilter, setBaptizedFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [isEditFamilyDialogOpen, setIsEditFamilyDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm1, setShowBulkDeleteConfirm1] = useState(false);
  const [showBulkDeleteConfirm2, setShowBulkDeleteConfirm2] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingMySQL, setIsDeletingMySQL] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "",
      baptized: "",
      email: "",
      area_code: "",
      phone_number: "",
      family_id: "none",
      street_address: "",
      street_address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      birth_month: "",
      birth_day: "",
      birth_year: "",
      position: "",
      department: "",
      service_year: ""
    }
  });

  const familyForm = useForm<z.infer<typeof familyFormSchema>>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      family_name: ""
    }
  });

  useEffect(() => {
    checkAccessAndLoadMembers();
  }, []);

  const checkAccessAndLoadMembers = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Check if user has permission to view members
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const hasAnyRole = roles?.some(r => 
        r.role === 'administrator' || 
        r.role === 'staff' || 
        r.role === 'viewer' || 
        r.role === 'editor' ||
        r.role === 'teacher' ||
        r.role === 'member'
      );
      
      if (!hasAnyRole) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // Load families
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*')
        .order('family_name');
      if (!familiesError) setFamilies(familiesData || []);

      // Load members with family data - force fresh data with timestamp
      const timestamp = new Date().getTime();
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, families(*)')
        .order('name')
        .range(0, 10000); // Force query execution

      if (membersError) throw membersError;

      console.log(`Loaded ${membersData?.length || 0} members at ${timestamp}`);
      setMembers(membersData || []);
      setFilteredMembers(membersData || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = members;

    // Filter by search query (name, email, phone)
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone?.includes(searchQuery)
      );
    }

    // Filter by position
    if (positionFilter) {
      filtered = filtered.filter(member =>
        member.position?.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Filter by baptized
    if (baptizedFilter && baptizedFilter !== "all") {
      filtered = filtered.filter(member => {
        if (baptizedFilter === "yes") return member.baptized === true;
        if (baptizedFilter === "no") return member.baptized === false;
        return true;
      });
    }

    // Filter by gender
    if (genderFilter && genderFilter !== "all") {
      filtered = filtered.filter(member =>
        member.gender?.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // Filter by family
    if (familyFilter && familyFilter !== "all") {
      filtered = filtered.filter(member =>
        member.family_id === familyFilter
      );
    }

    // Filter by department
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter(member =>
        member.department?.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, positionFilter, baptizedFilter, genderFilter, familyFilter, departmentFilter, members]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setPositionFilter("");
    setBaptizedFilter("all");
    setGenderFilter("all");
    setFamilyFilter("all");
    setDepartmentFilter("all");
  };

  const maleCount = members.filter(m => m.gender?.toLowerCase() === 'male').length;
  const femaleCount = members.filter(m => m.gender?.toLowerCase() === 'female').length;
  const baptizedCount = members.filter(m => m.baptized === true).length;
  
  const uniqueDepartments = Array.from(new Set(members.map(m => m.department).filter(Boolean))) as string[];
  const uniquePositions = Array.from(new Set(members.map(m => m.position).filter(Boolean))) as string[];

  const parseMemberData = (values: z.infer<typeof memberFormSchema>, profileImageUrl?: string) => {
    const fullName = `${values.first_name} ${values.last_name}`.trim();
    
    // Build address with proper structure: street|||line2|||city|||state|||zip
    const fullAddress = [
      values.street_address || "",
      values.street_address_line2 || "",
      values.city || "",
      values.state || "",
      values.postal_code || ""
    ].join('|||');
    
    const fullPhone = values.area_code && values.phone_number 
      ? `${values.area_code}-${values.phone_number}`
      : null;
    
    const birthDate = values.birth_year && values.birth_month && values.birth_day
      ? `${values.birth_year}-${values.birth_month.padStart(2, '0')}-${values.birth_day.padStart(2, '0')}`
      : null;

    return {
      name: fullName,
      address: fullAddress || null,
      phone: fullPhone,
      email: values.email || null,
      date_of_birth: birthDate,
      gender: values.gender || null,
      baptized: values.baptized === "yes" ? true : values.baptized === "no" ? false : null,
      position: values.position || null,
      department: values.department || null,
      service_year: values.service_year || null,
      profile_image_url: profileImageUrl || null,
      church_groups: null,
      family_id: values.family_id && values.family_id !== 'none' ? values.family_id : null
    };
  };

  const handleAddMember = async (values: z.infer<typeof memberFormSchema>) => {
    try {
      const memberData = parseMemberData(values);
      const { error } = await supabase.from('members').insert([memberData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setIsAddDialogOpen(false);
      form.reset();
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditMember = (member: Member) => {
    // Parse existing data to populate form
    const nameParts = member.name.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";
    
    const phoneParts = member.phone?.split('-') || [];
    const areaCode = phoneParts[0] || "";
    const phoneNumber = phoneParts.slice(1).join('-') || "";
    
    // Parse address - format: street|||line2|||city|||state|||zip
    let streetAddress = "";
    let streetAddressLine2 = "";
    let city = "";
    let state = "";
    let postalCode = "";
    
    if (member.address) {
      if (member.address.includes('|||')) {
        const addressParts = member.address.split('|||');
        streetAddress = addressParts[0] || "";
        streetAddressLine2 = addressParts[1] || "";
        city = addressParts[2] || "";
        state = addressParts[3] || "";
        postalCode = addressParts[4] || "";
      } else {
        // Old comma format fallback
        const parts = member.address.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          streetAddress = parts[0] || "";
          city = parts[1] || "";
          state = parts[2] || "";
          postalCode = parts[3] || "";
        }
      }
    }
    
    // Parse birth date
    const birthParts = member.date_of_birth?.split('-') || [];
    const birthYear = birthParts[0] || "";
    const birthMonth = birthParts[1] || "";
    const birthDay = birthParts[2] || "";
    
    form.reset({
      first_name: firstName,
      last_name: lastName,
      gender: member.gender || "",
      baptized: member.baptized === true ? "yes" : member.baptized === false ? "no" : "",
      email: member.email || "",
      area_code: areaCode,
      phone_number: phoneNumber,
      family_id: member.family_id || "none",
      street_address: streetAddress,
      street_address_line2: streetAddressLine2,
      city: city,
      state: state,
      postal_code: postalCode,
      birth_month: birthMonth,
      birth_day: birthDay,
      birth_year: birthYear,
      position: member.position || "",
      department: member.department || "",
      service_year: member.service_year || ""
    });
    
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMember = async (values: z.infer<typeof memberFormSchema>) => {
    if (!selectedMember) return;
    
    try {
      const memberData = parseMemberData(values);
      const { error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedMember(null);
      form.reset();
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member deleted successfully",
      });

      setMemberToDelete(null);
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Format: Name, Email, Gender, Baptized, Phone, Street Address, Apt/Unit, City, State, Zip Code, Date of Birth, Position, Group By Family
      const membersToImport = await Promise.all(jsonData.map(async (row: any) => {
        // Build address with proper structure: street|||line2|||city|||state|||zip
        const streetAddress = row['Street Address'] || '';
        const aptUnit = row['Apt/Unit'] || '';
        const city = row['City'] || '';
        const state = row['State'] || '';
        const zipCode = row['Zip Code'] || '';
        
        const fullAddress = [streetAddress, aptUnit, city, state, zipCode].join('|||');
        
        // Parse date of birth - try multiple formats
        let dateOfBirth = null;
        const dobValue = row['Date of Birth'];
        if (dobValue) {
          // If it's already in YYYY-MM-DD format
          if (typeof dobValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dobValue)) {
            dateOfBirth = dobValue;
          } else if (typeof dobValue === 'number') {
            // Excel serial date number
            const date = new Date((dobValue - 25569) * 86400 * 1000);
            dateOfBirth = date.toISOString().split('T')[0];
          } else if (typeof dobValue === 'string') {
            // Try parsing common date formats
            const parsed = new Date(dobValue);
            if (!isNaN(parsed.getTime())) {
              dateOfBirth = parsed.toISOString().split('T')[0];
            }
          }
        }

        // Handle Group By Family - match with existing family or null
        let familyId = null;
        const familyName = row['Group By Family'];
        if (familyName) {
          const matchedFamily = families.find(f => 
            f.family_name.toLowerCase().trim() === familyName.toString().toLowerCase().trim()
          );
          if (matchedFamily) {
            familyId = matchedFamily.id;
          }
        }
        
        return {
          name: row['Name'] || '',
          gender: row['Gender'] || null,
          email: row['Email'] || null,
          phone: row['Phone'] || null,
          address: fullAddress || null,
          date_of_birth: dateOfBirth,
          position: row['Position'] || null,
          baptized: row['Baptized']?.toString().toLowerCase() === 'yes' ? true : row['Baptized']?.toString().toLowerCase() === 'no' ? false : null,
          family_id: familyId,
          church_groups: null
        };
      }));

      const validMembers = membersToImport.filter(m => m.name);

      if (validMembers.length === 0) {
        throw new Error('No valid members found in the file');
      }

      const { error } = await supabase
        .from('members')
        .insert(validMembers);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${validMembers.length} members imported successfully`,
      });

      setIsBulkImportDialogOpen(false);
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSelectAll = (selectAllMembers = false) => {
    const membersToSelect = selectAllMembers ? members : filteredMembers;
    if (selectedMembers.size === membersToSelect.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(membersToSelect.map(m => m.id)));
    }
  };

  const handleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "Error",
        description: "No members selected for deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingBulk(true);
    try {
      const memberIds = Array.from(selectedMembers);
      const batchSize = 10; // Very small batches to avoid request limits
      let successCount = 0;
      let errorCount = 0;
      
      toast({
        title: "Deleting...",
        description: `Deleting ${memberIds.length} members in batches...`,
      });
      
      // Delete in small batches with delay
      for (let i = 0; i < memberIds.length; i += batchSize) {
        const batch = memberIds.slice(i, i + batchSize);
        
        try {
          // Delete one at a time if batch fails
          for (const id of batch) {
            const { error } = await supabase
              .from('members')
              .delete()
              .eq('id', id);

            if (error) {
              console.error('Delete error for member:', id, error);
              errorCount++;
            } else {
              successCount++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (batchError) {
          console.error('Batch error:', batchError);
          errorCount += batch.length;
        }
        
        // Update progress
        if ((i + batchSize) % 50 === 0) {
          toast({
            title: "Progress",
            description: `Deleted ${successCount} of ${memberIds.length} members...`,
          });
        }
      }

      if (errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successCount} members deleted, ${errorCount} failed. Please refresh and try again for remaining members.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${successCount} member${successCount > 1 ? 's' : ''} deleted successfully`,
        });
      }

      setSelectedMembers(new Set());
      setShowBulkDeleteConfirm2(false);
      
      // Refresh after a short delay
      setTimeout(() => {
        checkAccessAndLoadMembers();
      }, 1000);
    } catch (error: unknown) {
      let message = "Failed to delete members. ";
      if (error instanceof Error) {
        message += error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message += String((error as { message: unknown }).message);
      }
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const formatAddressForExport = (address: string | null): string => {
    if (!address) return '';
    // Address is stored with pipe separators: street|||line2|||city|||state|||zip
    const parts = address.split('|||').filter(part => part.trim() !== '');
    if (parts.length >= 4) {
      // Apply state abbreviation
      parts[3] = getStateAbbreviation(parts[3]);
    }
    return parts.join(', ');
  };

  const formatAddressDisplay = (address: string | null): string => {
    if (!address) return '';
    const parts = address.split('|||').map(p => p?.trim()).filter(p => p && p.length > 0);
    if (parts.length === 0) return '';
    // Find and convert state abbreviation (usually index 3 if full address)
    if (parts.length >= 4) {
      parts[3] = getStateAbbreviation(parts[3]);
    }
    return parts.join(', ');
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkAccessAndLoadMembers();
      toast({
        title: "Refreshed",
        description: "Member data reloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteAllMySQL = async () => {
    if (!confirm('Are you sure you want to delete ALL members from MySQL database? This cannot be undone!')) {
      return;
    }
    
    setIsDeletingMySQL(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('mysql-sync', {
        body: { deleteAll: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        // Refresh the member list
        await checkAccessAndLoadMembers();
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to delete MySQL members',
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to delete MySQL members: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingMySQL(false);
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredMembers.map(member => ({
      Name: member.name,
      Email: member.email || '',
      Gender: member.gender || '',
      Baptized: member.baptized === true ? 'Yes' : member.baptized === false ? 'No' : '',
      Phone: member.phone || '',
      Address: member.families 
        ? `${member.families.street_address}${member.families.street_address_line2 ? `, ${member.families.street_address_line2}` : ''}, ${member.families.city}, ${getStateAbbreviation(member.families.state)} ${member.families.postal_code}`
        : formatAddressForExport(member.address),
      'Date of Birth': member.date_of_birth || '',
      Position: member.position || '',
      'Group By Family': member.families?.family_name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `church_members_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Success",
      description: "Member directory exported to Excel",
    });
  };

  const handleAddFamily = async (values: z.infer<typeof familyFormSchema>) => {
    try {
      const familyData = {
        family_name: values.family_name,
        street_address: '',
        street_address_line2: null,
        city: '',
        county: '',
        state: '',
        postal_code: ''
      };

      const { error } = await supabase.from('families').insert([familyData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family added successfully",
      });

      setIsFamilyDialogOpen(false);
      familyForm.reset();
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditFamily = (family: Family) => {
    familyForm.reset({
      family_name: family.family_name
    });
    setSelectedFamily(family);
    setIsEditFamilyDialogOpen(true);
  };

  const handleUpdateFamily = async (values: z.infer<typeof familyFormSchema>) => {
    if (!selectedFamily) return;
    
    try {
      const familyData = {
        family_name: values.family_name
      };

      const { error } = await supabase
        .from('families')
        .update(familyData)
        .eq('id', selectedFamily.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family updated successfully",
      });

      setIsEditFamilyDialogOpen(false);
      setSelectedFamily(null);
      familyForm.reset();
      checkAccessAndLoadMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Group members by family
  const getMembersByFamily = () => {
    const grouped = new Map<string, Member[]>();
    const noFamily: Member[] = [];

    filteredMembers.forEach(member => {
      if (member.family_id && member.families) {
        const familyId = member.family_id;
        if (!grouped.has(familyId)) {
          grouped.set(familyId, []);
        }
        grouped.get(familyId)!.push(member);
      } else {
        noFamily.push(member);
      }
    });

    return { grouped, noFamily };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center mt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading member directory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Member Directory</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                This directory is restricted to authorized staff members only.
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must be signed in with a staff account to access the member directory.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full mt-4"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="font-display text-2xl">Access Denied</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                You do not have permission to access the member directory.
              </p>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This directory is restricted to authorized staff members. Please contact church administration if you believe you should have access.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="w-full mt-4"
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Member Directory
              </h1>
              <p className="text-muted-foreground mt-2">Connect with our church family</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Male</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{maleCount}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-pink-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Females</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{femaleCount}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Baptized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{baptizedCount}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Families</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{families.length}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{uniqueDepartments.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <UpcomingBirthdays />

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <Label className="text-base font-semibold mb-2">Full Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Group Family</Label>
                <Select value={familyFilter} onValueChange={setFamilyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Families" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Families</SelectItem>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.family_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Baptized</Label>
                <Select value={baptizedFilter} onValueChange={setBaptizedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">Position</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by position..."
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(searchQuery || (genderFilter !== "all") || (familyFilter !== "all") || (departmentFilter !== "all") || (baptizedFilter !== "all") || positionFilter) && (
                <Badge variant="secondary" className="gap-1">
                  {[
                    searchQuery, 
                    genderFilter !== "all" ? genderFilter : "", 
                    familyFilter !== "all" ? "Family" : "", 
                    departmentFilter !== "all" ? departmentFilter : "", 
                    baptizedFilter !== "all" ? `Baptized: ${baptizedFilter}` : "",
                    positionFilter
                  ].filter(Boolean).length} filter(s) active
                </Badge>
              )}
              {(searchQuery || (genderFilter !== "all") || (familyFilter !== "all") || (departmentFilter !== "all") || (baptizedFilter !== "all") || positionFilter) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  Reset Filters
                </Button>
              )}
              <Button onClick={handleForceRefresh} variant="outline" size="sm" disabled={isRefreshing} className="gap-2 ml-auto">
                <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              {can('manage_users') && (
                <Button 
                  onClick={handleDeleteAllMySQL} 
                  variant="destructive" 
                  size="sm" 
                  disabled={isDeletingMySQL}
                  className="gap-2"
                >
                  <Trash2 className={`w-4 h-4 ${isDeletingMySQL ? 'animate-spin' : ''}`} />
                  {isDeletingMySQL ? 'Deleting MySQL...' : 'Clear MySQL Data'}
                </Button>
              )}
              <Button onClick={handleExportToExcel} variant="outline" size="sm" disabled={filteredMembers.length === 0} className="gap-2">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="font-display text-2xl font-bold">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
            {(searchQuery || positionFilter || (genderFilter !== "all") || (familyFilter !== "all") || (departmentFilter !== "all") || (baptizedFilter !== "all")) && (
              <span className="text-muted-foreground font-normal text-lg ml-2">
                (filtered from {members.length})
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            {can('manage_members') && members.length > 0 && (
              <Button 
                onClick={() => {
                  handleSelectAll(true);
                  setTimeout(() => {
                    if (members.length > 0) {
                      setShowBulkDeleteConfirm1(true);
                    }
                  }, 100);
                }}
                variant="destructive"
                size="sm"
                className="gap-2 font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Select All & Delete All ({members.length})
              </Button>
            )}
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button 
                onClick={() => setViewMode("list")} 
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setViewMode("grid")} 
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={() => setGroupByFamily(!groupByFamily)} 
              variant={groupByFamily ? "default" : "outline"}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              {groupByFamily ? "Show All" : "Group by Family"}
            </Button>
            {can('manage_members') && (
              <>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Member</DialogTitle>
                      <DialogDescription>
                        Add a new member to the directory. Fields marked with * are required.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddMember)} className="space-y-4 py-4">
                        {/* Name Section */}
                        <div>
                          <Label className="text-sm font-semibold">Name *</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="first_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="last_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Gender & Baptized Section */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Gender *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="baptized"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Baptized</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Position & Department Section */}
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Position</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Vice Chairman, Member" className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Department</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Deacon, Youth" className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="service_year"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold">Service Year</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 2025 - 2026" className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Email Section */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">E-mail</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="ex: myname@example.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Phone Number Section */}
                        <div>
                          <Label className="text-sm font-semibold">Phone Number</Label>
                          <div className="grid grid-cols-[120px_1fr] gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="area_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Area Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="515" maxLength={3} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="318-4281" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Family Selection */}
                        <FormField
                          control={form.control}
                          name="family_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign to Family (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a family or leave unassigned" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">No Family (Individual)</SelectItem>
                                  {families.map((family) => (
                                    <SelectItem key={family.id} value={family.id}>
                                      {family.family_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Address Section */}
                        <div>
                          <Label className="text-sm font-semibold">Address</Label>
                          <div className="space-y-4 mt-2">
                            <FormField
                              control={form.control}
                              name="street_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main St" autoComplete="off" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="street_address_line2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address Line 2</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Apt, suite, etc. (optional)" autoComplete="off" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">City</FormLabel>
                                    <FormControl>
                                      <Input {...field} autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">State</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select state" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {US_STATES.map((state) => (
                                          <SelectItem key={state} value={state}>
                                            {state}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="postal_code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Zip Code</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="12345 or 12345-6789" autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Birth Date Section */}
                        <div>
                          <Label className="text-sm font-semibold">Birth Date</Label>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="birth_month"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Month</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" max="12" placeholder="MM" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birth_day"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Day</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" max="31" placeholder="DD" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birth_year"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Year</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1900" max={new Date().getFullYear()} placeholder="YYYY" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddDialogOpen(false);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Add Member
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        Add Family
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Family</DialogTitle>
                        <DialogDescription>
                          Create a family group. Members can then be assigned to this family.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...familyForm}>
                        <form onSubmit={familyForm.handleSubmit(handleAddFamily)} className="space-y-4 py-4">
                          <FormField
                            control={familyForm.control}
                            name="family_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Family Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="The Smith Family" autoComplete="off" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsFamilyDialogOpen(false);
                                familyForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              Create Family
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Edit Family Dialog */}
                  <Dialog open={isEditFamilyDialogOpen} onOpenChange={setIsEditFamilyDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Family</DialogTitle>
                        <DialogDescription>
                          Update the family information. Members assigned to this family will see the updated details.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...familyForm}>
                        <form onSubmit={familyForm.handleSubmit(handleUpdateFamily)} className="space-y-4 py-4">
                          <FormField
                            control={familyForm.control}
                            name="family_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Family Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="The Smith Family" autoComplete="off" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsEditFamilyDialogOpen(false);
                                setSelectedFamily(null);
                                familyForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              Update Family
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                {/* Edit Member Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Member</DialogTitle>
                      <DialogDescription>
                        Update member information. Fields marked with * are required.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleUpdateMember)} className="space-y-4 py-4">
                        {/* Name Section */}
                        <div>
                          <Label className="text-sm font-semibold">Name *</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="first_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="last_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Gender & Profile Image Section */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Gender *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div>
                            <Label className="text-sm font-semibold">Profile Image (Optional)</Label>
                            <div className="mt-2">
                              <Input 
                                type="file" 
                                accept="image/*"
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        </div>

                        {/* Position & Department Section */}
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Position *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Vice Chairman, Member" className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Department (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Deacon, Youth" className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="service_year"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold">Service Year (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 2025 - 2026" className="bg-background" />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Enter the service period</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Email Section */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">E-mail *</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="ex: myname@example.com" />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">example@example.com</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Phone Number Section */}
                        <div>
                          <Label className="text-sm font-semibold">Phone Number *</Label>
                          <div className="grid grid-cols-[120px_1fr] gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="area_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Area Code *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="515" maxLength={3} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="318-4281" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Family Selection */}
                        <FormField
                          control={form.control}
                          name="family_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign to Family (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a family or leave unassigned" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">No Family (Individual)</SelectItem>
                                  {families.map((family) => (
                                    <SelectItem key={family.id} value={family.id}>
                                      {family.family_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Address Section */}
                        <div>
                          <Label className="text-sm font-semibold">Address *</Label>
                          <div className="space-y-4 mt-2">
                            <FormField
                              control={form.control}
                              name="street_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main St" autoComplete="off" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="street_address_line2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address Line 2 (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Apt, suite, etc. (optional)" autoComplete="off" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">City *</FormLabel>
                                    <FormControl>
                                      <Input {...field} autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">State *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select state" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {US_STATES.map((state) => (
                                          <SelectItem key={state} value={state}>
                                            {state}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="postal_code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Zip Code *</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="12345 or 12345-6789" autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Birth Date Section */}
                        <div>
                          <Label className="text-sm font-semibold">Birth Date *</Label>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="birth_month"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Month *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" max="12" placeholder="MM" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birth_day"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Day *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" max="31" placeholder="DD" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="birth_year"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Year *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1900" max={new Date().getFullYear()} placeholder="YYYY" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsEditDialogOpen(false);
                              setSelectedMember(null);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Update Member
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                {/* Bulk Import Dialog */}
                <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Import Members</DialogTitle>
                      <DialogDescription>
                        Upload an Excel file (.xlsx) with member data. The file should have these columns:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <p className="font-semibold mb-2">Required columns:</p>
                        <p className="font-mono text-xs">Name, Email, Gender, Baptized, Phone, Street Address, Apt/Unit, City, State, Zip Code, Date of Birth, Position, Group By Family</p>
                        <p className="text-xs mt-2 text-muted-foreground">Note: "Group By Family" should match an existing family name exactly to link members.</p>
                      </div>
                      <div>
                        <Label htmlFor="import-file">Select File</Label>
                        <Input
                          id="import-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleBulkImport}
                          disabled={isImporting}
                          className="mt-2"
                        />
                      </div>
                      {isImporting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing members...
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Table View */}
        <Card>
          <CardContent className="pt-6">
              {members.length === 0 ? (
            <div className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">No Members Yet</h3>
              <p className="text-muted-foreground mb-4">
                The member directory is currently empty.
              </p>
              {can('manage_members') && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">No Members Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search filters
              </p>
            </div>
          ) : groupByFamily ? (
            // Family-grouped view
            <div className="space-y-6">
              {(() => {
                const { grouped, noFamily } = getMembersByFamily();
                return (
                  <>
                    {Array.from(grouped.entries()).map(([familyId, familyMembers]) => {
                      const family = familyMembers[0]?.families;
                      if (!family) return null;
                      return (
                        <Card key={familyId}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                {family.family_name}
                              </CardTitle>
                              {can('manage_members') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditFamily(family)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Family
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {family.street_address}{family.street_address_line2 && `, ${family.street_address_line2}`}, {family.city}, {getStateAbbreviation(family.state)} {family.postal_code}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Gender</TableHead>
                                  <TableHead>Baptized</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Date of Birth</TableHead>
                                  <TableHead>Position</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {familyMembers.map((member) => (
                                  <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>
                                      {member.email ? (
                                        <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                                          {member.email}
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>{member.gender || <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell>
                                      {member.baptized === true ? (
                                        <Badge variant="default" className="bg-green-500">Yes</Badge>
                                      ) : member.baptized === false ? (
                                        <Badge variant="secondary">No</Badge>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {member.phone ? (
                                        <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                                          {member.phone}
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {member.date_of_birth ? (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-muted-foreground" />
                                          {new Date(member.date_of_birth).toLocaleDateString()}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>{member.position || <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(`/members/${member.id}`)}
                                          title="View profile"
                                          className="gap-2"
                                        >
                                          <Eye className="w-4 h-4" />
                                          <span>View Profile</span>
                                        </Button>
                                        {can('manage_members') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditMember(member)}
                                            title="Edit member"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {can('manage_members') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setMemberToDelete(member)}
                                            title="Delete member"
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {noFamily.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-muted-foreground" />
                            Individual Members
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">Members not assigned to a family</p>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Baptized</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Date of Birth</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {noFamily.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell className="font-medium">{member.name}</TableCell>
                                  <TableCell>
                                    {member.email ? (
                                      <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                                        {member.email}
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{member.gender || <span className="text-muted-foreground">—</span>}</TableCell>
                                  <TableCell>
                                    {member.baptized === true ? (
                                      <Badge variant="default" className="bg-green-500">Yes</Badge>
                                    ) : member.baptized === false ? (
                                      <Badge variant="secondary">No</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {member.phone ? (
                                      <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                                        {member.phone}
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {member.address ? (
                                      <div className="max-w-xs truncate" title={member.address}>
                                        {formatAddressDisplay(member.address)}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {member.date_of_birth ? (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                        {new Date(member.date_of_birth).toLocaleDateString()}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{member.position || <span className="text-muted-foreground">—</span>}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/members/${member.id}`)}
                                        title="View profile"
                                        className="gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>View Profile</span>
                                      </Button>
                                      {can('manage_members') && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditMember(member)}
                                          title="Edit member"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      )}
                                      {can('manage_members') && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setMemberToDelete(member)}
                                          title="Delete member"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          ) : viewMode === "grid" ? (
            // Grid view
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                      {member.profile_image_url ? (
                        <img 
                          src={member.profile_image_url} 
                          alt={member.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                    <Button 
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="mt-2"
                      size="sm"
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Regular table view (list mode)
            <div className="overflow-x-auto">
                {can('manage_members') && selectedMembers.size > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
                    </span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm1(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      {can('manage_members') && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                      )}
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Baptized</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Group Family</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        {can('manage_members') && (
                          <TableCell>
                            <Checkbox
                              checked={selectedMembers.has(member.id)}
                              onCheckedChange={() => handleSelectMember(member.id)}
                              aria-label={`Select ${member.name}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          {member.email ? (
                            <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                              {member.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{member.gender || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {member.baptized === true ? (
                            <Badge variant="default" className="bg-green-500">Yes</Badge>
                          ) : member.baptized === false ? (
                            <Badge variant="secondary">No</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.phone ? (
                            <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                              {member.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.families ? (
                            <div className="max-w-xs truncate">
                              {member.families.street_address}{member.families.street_address_line2 && `, ${member.families.street_address_line2}`}, {member.families.city}, {getStateAbbreviation(member.families.state)} {member.families.postal_code}
                            </div>
                          ) : member.address ? (
                            <div className="max-w-xs truncate" title={member.address}>
                              {formatAddressDisplay(member.address)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.date_of_birth ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {new Date(member.date_of_birth).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{member.position || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {member.families?.family_name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/members/${member.id}`)}
                              title="View profile"
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Profile</span>
                            </Button>
                            {can('manage_members') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMember(member)}
                                title="Edit member"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {can('manage_members') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMemberToDelete(member)}
                                title="Delete member"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{memberToDelete?.name}</strong> from the member directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation 1 */}
      <AlertDialog open={showBulkDeleteConfirm1} onOpenChange={setShowBulkDeleteConfirm1}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedMembers.size} members?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <strong>{selectedMembers.size}</strong> member{selectedMembers.size > 1 ? 's' : ''} from the directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowBulkDeleteConfirm1(false);
                setShowBulkDeleteConfirm2(true);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation 2 */}
      <AlertDialog open={showBulkDeleteConfirm2} onOpenChange={setShowBulkDeleteConfirm2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to permanently delete <strong>{selectedMembers.size}</strong> member{selectedMembers.size > 1 ? 's' : ''}? 
              <br /><br />
              <strong className="text-destructive">This action is irreversible and all data will be lost.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingBulk}
            >
              {isDeletingBulk ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Members;
