import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, MapPin, Phone, User, AlertTriangle, Loader2, Download, Plus, Filter, Calendar, Users, Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

const memberFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  area_code: z.string().regex(/^\d{3}$/, "Area code must be 3 digits").optional().or(z.literal("")),
  phone_number: z.string().regex(/^\d{7,10}$/, "Phone number must be 7-10 digits").optional().or(z.literal("")),
  street_address: z.string().max(200, "Street address must be less than 200 characters").optional().or(z.literal("")),
  street_address_line2: z.string().max(200, "Street address line 2 must be less than 200 characters").optional().or(z.literal("")),
  city: z.string().max(100, "City must be less than 100 characters").optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  county: z.string().max(100, "County must be less than 100 characters").optional().or(z.literal("")),
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format (e.g., 12345 or 12345-6789)").optional().or(z.literal("")),
  birth_month: z.string().optional().or(z.literal("")),
  birth_day: z.string().optional().or(z.literal("")),
  birth_year: z.string().optional().or(z.literal("")),
  church_groups: z.string().max(500, "Church groups must be less than 500 characters").optional().or(z.literal(""))
}).refine((data) => {
  // If area code is provided, phone number must be provided and vice versa
  if (data.area_code && !data.phone_number) return false;
  if (data.phone_number && !data.area_code) return false;
  return true;
}, {
  message: "Both area code and phone number must be provided together",
  path: ["phone_number"]
}).refine((data) => {
  // If any birth field is provided, all must be provided
  const hasAnyBirthField = data.birth_month || data.birth_day || data.birth_year;
  const hasAllBirthFields = data.birth_month && data.birth_day && data.birth_year;
  if (hasAnyBirthField && !hasAllBirthFields) return false;
  return true;
}, {
  message: "All birth date fields (month, day, year) must be provided",
  path: ["birth_year"]
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

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  church_groups: string[] | null;
}

const Members = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
      church_groups: ""
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

      // Check if user has staff or admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const hasStaffAccess = roles?.some(r => r.role === 'staff' || r.role === 'admin');
      const isAdminUser = roles?.some(r => r.role === 'admin');
      
      if (!hasStaffAccess) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setIsAdmin(isAdminUser);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
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

    // Filter by church group
    if (groupFilter) {
      filtered = filtered.filter(member =>
        member.church_groups?.some(group =>
          group.toLowerCase().includes(groupFilter.toLowerCase())
        )
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, groupFilter, members]);

  const parseMemberData = (values: z.infer<typeof memberFormSchema>) => {
    const churchGroupsArray = values.church_groups
      ? values.church_groups.split(',').map(g => g.trim()).filter(g => g.length > 0)
      : [];

    const fullName = `${values.first_name} ${values.last_name}`.trim();
    
    const addressParts = [
      values.street_address,
      values.street_address_line2,
      values.city,
      values.county ? `${values.county} County` : null,
      values.state,
      values.postal_code
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    
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
      church_groups: churchGroupsArray.length > 0 ? churchGroupsArray : null
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
    
    // Parse address
    const addressParts = member.address?.split(', ') || [];
    let streetAddress = "";
    let streetAddressLine2 = "";
    let city = "";
    let county = "";
    let state = "";
    let postalCode = "";
    
    if (addressParts.length > 0) {
      streetAddress = addressParts[0] || "";
      if (addressParts.length > 1) streetAddressLine2 = addressParts[1] || "";
      if (addressParts.length > 2) city = addressParts[2] || "";
      if (addressParts.length > 3) {
        const countyPart = addressParts[3] || "";
        county = countyPart.replace(' County', '');
      }
      if (addressParts.length > 4) state = addressParts[4] || "";
      if (addressParts.length > 5) postalCode = addressParts[5] || "";
    }
    
    // Parse birth date
    const birthParts = member.date_of_birth?.split('-') || [];
    const birthYear = birthParts[0] || "";
    const birthMonth = birthParts[1] || "";
    const birthDay = birthParts[2] || "";
    
    form.reset({
      first_name: firstName,
      last_name: lastName,
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
      church_groups: member.church_groups?.join(', ') || ""
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
        const churchGroups = row['Church Groups'] 
          ? String(row['Church Groups']).split(',').map((g: string) => g.trim())
          : null;

        return {
          name: row['Name'] || '',
          email: row['Email'] || null,
          phone: row['Phone'] || null,
          address: row['Address'] || null,
          date_of_birth: row['Date of Birth'] || null,
          church_groups: churchGroups
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
      Address: member.address || '',
      Phone: member.phone || '',
      Email: member.email || '',
      'Date of Birth': member.date_of_birth || '',
      'Church Groups': member.church_groups?.join(', ') || ''
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
        <Navigation />
        
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
        <Navigation />
        
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <User className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Member Directory</h1>
          <p className="text-lg text-primary-foreground/90">
            Connect with our church family
          </p>
        </div>
      </section>

      {/* Members Directory */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="font-display text-2xl font-bold">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
              {(searchQuery || groupFilter) && ` (filtered from ${members.length})`}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportToExcel} variant="outline" disabled={filteredMembers.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              {isAdmin && (
                <>
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
                              <p className="text-xs text-muted-foreground">example@example.com</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Phone Number Section */}
                        <div>
                          <Label className="text-sm font-semibold">Phone Number</Label>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="area_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Area Code</FormLabel>
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
                                    <FormLabel className="text-xs text-muted-foreground">Phone Number</FormLabel>
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
                          <Label className="text-sm font-semibold">Address</Label>
                          <div className="grid gap-3 mt-2">
                            <FormField
                              control={form.control}
                              name="street_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">Street Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main Street" />
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
                                    <Input {...field} placeholder="Apt, Suite, Unit, etc." />
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
                                      <Input {...field} />
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
                                    <FormLabel className="text-xs text-muted-foreground">County</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., Howard" />
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
                                    <FormLabel className="text-xs text-muted-foreground">Zip Code</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="12345 or 12345-6789" />
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

                        {/* Church Groups Section */}
                        <FormField
                          control={form.control}
                          name="church_groups"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Church Groups/Activities</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Youth Group, Choir, Volunteer (comma separated)"
                                  rows={3}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Separate multiple groups with commas
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter by church group..."
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground mb-4">
                  The member directory is currently empty.
                </p>
                {isAdmin && (
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
          ) : (
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
                      <TableHead>Church Groups</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                        <TableCell>
                          {member.church_groups && member.church_groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.church_groups.map((group, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMember(member)}
                                title="Edit member"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMemberToDelete(member)}
                                title="Delete member"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </section>

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

      <Footer />
    </div>
  );
};

export default Members;
