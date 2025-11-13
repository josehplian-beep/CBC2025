import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, MapPin, Phone, User, AlertTriangle, Loader2, Download, Plus, Filter, Calendar, Users, Edit, Trash2, Upload, Eye, Search } from "lucide-react";
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

const COUNTY_OPTIONS = ["Howard", "Baltimore", "Anne Arundel", "Other"];

const familyFormSchema = z.object({
  family_name: z.string().min(1, "Family name is required").max(100, "Family name must be less than 100 characters"),
  street_address: z.string().min(1, "Street address is required").max(200, "Street address must be less than 200 characters"),
  street_address_line2: z.string().max(200, "Street address line 2 must be less than 200 characters").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().min(1, "State is required"),
  county: z.string().min(1, "County is required"),
  postal_code: z.string().min(1, "ZIP code is required").regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format (e.g., 12345 or 12345-6789)")
});

const memberFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(255, "Email must be less than 255 characters"),
  area_code: z.string().min(1, "Area code is required").regex(/^\d{3}$/, "Area code must be 3 digits"),
  phone_number: z.string().min(1, "Phone number is required").regex(/^\d{7,10}$/, "Phone number must be 7-10 digits"),
  street_address: z.string().min(1, "Street address is required").max(200, "Street address must be less than 200 characters"),
  street_address_line2: z.string().max(200, "Street address line 2 must be less than 200 characters").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().min(1, "State is required"),
  county: z.string().min(1, "County is required"),
  postal_code: z.string().min(1, "ZIP code is required").regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format (e.g., 12345 or 12345-6789)"),
  birth_month: z.string().min(1, "Birth month is required"),
  birth_day: z.string().min(1, "Birth day is required"),
  birth_year: z.string().min(1, "Birth year is required"),
  position: z.string().min(1, "Position is required").max(100, "Position must be less than 100 characters"),
  department: z.string().max(100, "Department must be less than 100 characters").optional().or(z.literal("")),
  service_year: z.string().max(50, "Service year must be less than 50 characters").optional().or(z.literal(""))
}).refine((data) => {
  // Validate birth date is a valid date
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
  const { role, isAdmin, canEdit, canCreate, canDelete } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "",
      email: "",
      area_code: "",
      phone_number: "",
      street_address: "",
      street_address_line2: "",
      city: "",
      state: "",
      county: "",
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
      family_name: "",
      street_address: "",
      street_address_line2: "",
      city: "",
      state: "",
      county: "",
      postal_code: ""
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

      // Check if user has any role (admin, staff, or viewer)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const hasAnyRole = roles?.some(r => r.role === 'staff' || r.role === 'admin' || r.role === 'viewer');
      
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

      if (familiesError) console.error('Error loading families:', familiesError);
      else setFamilies(familiesData || []);

      // Load members with family data
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, families(*)')
        .order('name');

      if (membersError) throw membersError;

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

    // Filter by city
    if (cityFilter) {
      filtered = filtered.filter(member =>
        member.address?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Filter by county
    if (countyFilter) {
      filtered = filtered.filter(member =>
        member.address?.toLowerCase().includes(countyFilter.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, cityFilter, countyFilter, members]);

  const parseMemberData = (values: z.infer<typeof memberFormSchema>, profileImageUrl?: string) => {
    const fullName = `${values.first_name} ${values.last_name}`.trim();
    
    // Build address with proper structure, using empty string for optional line2
    const fullAddress = [
      values.street_address,
      values.street_address_line2 || "",
      values.city,
      values.county ? `${values.county} County` : "",
      values.state,
      values.postal_code
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
      position: values.position || null,
      department: values.department || null,
      service_year: values.service_year || null,
      profile_image_url: profileImageUrl || null,
      church_groups: null
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
    
    // Parse address - handle both new (|||) and old (comma) format
    let streetAddress = "";
    let streetAddressLine2 = "";
    let city = "";
    let county = "";
    let state = "";
    let postalCode = "";
    
    if (member.address) {
      // Check if it's the new format with |||
      if (member.address.includes('|||')) {
        const addressParts = member.address.split('|||');
        streetAddress = addressParts[0] || "";
        streetAddressLine2 = addressParts[1] || "";
        city = addressParts[2] || "";
        county = (addressParts[3] || "").replace(' County', '');
        state = addressParts[4] || "";
        postalCode = addressParts[5] || "";
      } else {
        // Old format with commas - try to parse it
        // Expected format: "Street, City, County, State, ZIP"
        const parts = member.address.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          streetAddress = parts[0] || "";
          city = parts[1] || "";
          // The county might have " County" suffix
          const countyPart = parts[2] || "";
          county = countyPart.replace(' County', '');
          state = parts[3] || "";
          postalCode = parts[4] || "";
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
      email: member.email || "",
      area_code: areaCode,
      phone_number: phoneNumber,
      street_address: streetAddress,
      street_address_line2: streetAddressLine2,
      city: city,
      state: state,
      county: county,
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

      const membersToImport = jsonData.map((row: any) => {
        return {
          name: row['Name'] || '',
          gender: row['Gender'] || null,
          email: row['Email'] || null,
          phone: row['Phone'] || null,
          address: row['Address'] || null,
          date_of_birth: row['Date of Birth'] || null,
          position: row['Position'] || null,
          department: row['Department'] || null,
          service_year: row['Service Year'] || null,
          church_groups: null
        };
      }).filter(m => m.name); // Only import rows with names

      if (membersToImport.length === 0) {
        throw new Error('No valid members found in the file');
      }

      const { error } = await supabase
        .from('members')
        .insert(membersToImport);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${membersToImport.length} members imported successfully`,
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

  const handleExportToExcel = () => {
    const exportData = filteredMembers.map(member => ({
      Name: member.name,
      Gender: member.gender || '',
      Address: member.address || '',
      Phone: member.phone || '',
      Email: member.email || '',
      'Date of Birth': member.date_of_birth || '',
      Position: member.position || '',
      Department: member.department || '',
      'Service Year': member.service_year || ''
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
        street_address: values.street_address,
        street_address_line2: values.street_address_line2 || null,
        city: values.city,
        county: values.county,
        state: values.state,
        postal_code: values.postal_code
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
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Member Directory</h1>
        </div>
        <p className="text-muted-foreground">
          Connect with our church family
        </p>
      </div>

      {/* Upcoming Birthdays */}
      <div className="mb-8">
        <UpcomingBirthdays />
      </div>

      {/* Members Directory */}
      <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="font-display text-2xl font-bold">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
              {(searchQuery || cityFilter || countyFilter) && ` (filtered from ${members.length})`}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setGroupByFamily(!groupByFamily)} 
                variant={groupByFamily ? "default" : "outline"}
              >
                <Users className="w-4 h-4 mr-2" />
                {groupByFamily ? "Show All" : "Group by Family"}
              </Button>
              <Button onClick={handleExportToExcel} variant="outline" disabled={filteredMembers.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              {canCreate && (
                <>
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
                          Create a family group with a shared address. Members can then be assigned to this family.
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
                          
                          <div>
                            <Label className="text-sm font-semibold">Family Address *</Label>
                            <div className="grid gap-3 mt-2">
                              <FormField
                                control={familyForm.control}
                                name="street_address"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Street Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="123 Main Street" autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={familyForm.control}
                                name="street_address_line2"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Street Address Line 2 (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Apt, Suite, Unit, etc." autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={familyForm.control}
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
                                <FormField
                                  control={familyForm.control}
                                  name="county"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-muted-foreground">County</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select county" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {COUNTY_OPTIONS.map((county) => (
                                            <SelectItem key={county} value={county}>
                                              {county}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={familyForm.control}
                                  name="state"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-muted-foreground">State</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a state" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[300px]">
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
                                  control={familyForm.control}
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
                          Upload an Excel file to import multiple members at once. The file should have columns: Name, Email, Phone, Address, Date of Birth, Church Groups.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="bulk-import">Select Excel File</Label>
                          <Input
                            id="bulk-import"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleBulkImport}
                            disabled={isImporting}
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
                        Add a new member to the church directory. Fields marked with * are required.
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
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="area_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Area Code *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="tel" maxLength={3} placeholder="123" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name="phone_number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Phone Number *</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="tel" placeholder="4567890" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address Section */}
                        <div>
                          <Label className="text-sm font-semibold">Address *</Label>
                          <div className="grid gap-3 mt-2">
                            <FormField
                              control={form.control}
                              name="street_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main Street" autoComplete="off" />
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
                                    <Input {...field} placeholder="Apt, Suite, Unit, etc." autoComplete="off" />
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
                              <FormField
                                control={form.control}
                                name="county"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">County *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {COUNTY_OPTIONS.map((county) => (
                                          <SelectItem key={county} value={county}>
                                            {county}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
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
                                          <SelectValue placeholder="Select a state" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="max-h-[300px]">
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
                              <FormField
                                control={form.control}
                                name="county"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">County *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {COUNTY_OPTIONS.map((county) => (
                                          <SelectItem key={county} value={county}>
                                            {county}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
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
                </>
              )}
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Filter Options</h4>
                  <div className="space-y-2">
                    <Label htmlFor="city-filter">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city-filter"
                        placeholder="Filter by city..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county-filter">County</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="county-filter"
                        placeholder="Filter by county..."
                        value={countyFilter}
                        onChange={(e) => setCountyFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {(cityFilter || countyFilter) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setCityFilter("");
                        setCountyFilter("");
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground mb-4">
                  The member directory is currently empty.
                </p>
                {canCreate && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold mb-2">No Members Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search filters
                </p>
              </CardContent>
            </Card>
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
                            <CardTitle className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-primary" />
                              {family.family_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {family.street_address}{family.street_address_line2 && `, ${family.street_address_line2}`}, {family.city}, {family.county} County, {family.state} {family.postal_code}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Date of Birth</TableHead>
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
                                        {canEdit && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditMember(member)}
                                            title="Edit member"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {canDelete && (
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
                                <TableHead>Phone</TableHead>
                                <TableHead>Date of Birth</TableHead>
                                <TableHead>Address</TableHead>
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
                                  <TableCell>
                                    {member.address ? (
                                      <div className="max-w-xs truncate" title={member.address}>
                                        {member.address}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
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
                                      {canEdit && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditMember(member)}
                                          title="Edit member"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      )}
                                      {canDelete && (
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
          ) : (
            // Regular table view
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
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
                        <TableCell>
                          {member.address ? (
                            <div className="max-w-xs truncate" title={member.address}>
                              {member.address}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMember(member)}
                                title="Edit member"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
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
            </Card>
          )}
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
    </div>
  );
};

export default Members;
