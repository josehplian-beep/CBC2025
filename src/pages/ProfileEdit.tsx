import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional().or(z.literal("")),
  suffix: z.string().max(20).optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  baptized: z.string().optional(),
  email: z.string().email("Invalid email address").max(255).optional().or(z.literal("")),
  area_code: z.string().regex(/^\d{3}$/, "Area code must be 3 digits").optional().or(z.literal("")),
  phone_number: z.string()
    .refine((val) => {
      if (!val) return true;
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 10;
    }, "Phone number must be 7-10 digits")
    .optional()
    .or(z.literal("")),
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
});

interface Member {
  id: string;
  name: string;
  suffix: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  baptized: boolean | null;
  profile_image_url: string | null;
  position: string | null;
  department: string | null;
  service_year: string | null;
}

const ProfileEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      suffix: "",
      gender: "",
      baptized: "",
      email: "",
      area_code: "",
      phone_number: "",
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

  useEffect(() => {
    checkAccessAndLoadMember();
  }, [id]);

  const checkAccessAndLoadMember = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user is administrator or editor
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const isUserAdmin = roles?.some(r => r.role === 'administrator' || r.role === 'editor');
      
      // Check if user is editing their own profile (member linked to their user_id)
      const { data: ownMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('id', id)
        .maybeSingle();
      
      const isEditingOwnProfile = !!ownMember;
      setIsOwnProfile(isEditingOwnProfile);
      
      // Allow access if admin/editor OR if editing own profile
      if (!isUserAdmin && !isEditingOwnProfile) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // Load member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        toast({
          title: "Not Found",
          description: "Member not found",
          variant: "destructive",
        });
        navigate('/members');
        return;
      }

      setMember(memberData);
      setImagePreview(memberData.profile_image_url || '');
      
      // Parse and populate form
      const nameParts = memberData.name.split(' ');
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(' ') || "";
      
      const phoneParts = memberData.phone?.split('-') || [];
      const areaCode = phoneParts[0] || "";
      const phoneNumber = phoneParts.slice(1).join('-') || "";
      
      // Format: street|||line2|||city|||state|||zip
      const addressParts = memberData.address?.split('|||') || [];
      const streetAddress = addressParts[0] || "";
      const streetAddressLine2 = addressParts[1] || "";
      const city = addressParts[2] || "";
      const state = addressParts[3] || "";
      const postalCode = addressParts[4] || "";
      
      const birthParts = memberData.date_of_birth?.split('-') || [];
      const birthYear = birthParts[0] || "";
      const birthMonth = birthParts[1] || "";
      const birthDay = birthParts[2] || "";
      
      form.reset({
        first_name: firstName,
        last_name: lastName,
        suffix: memberData.suffix || "",
        gender: memberData.gender || "",
        baptized: memberData.baptized === true ? "yes" : memberData.baptized === false ? "no" : "",
        email: memberData.email || "",
        area_code: areaCode,
        phone_number: phoneNumber,
        street_address: streetAddress,
        street_address_line2: streetAddressLine2,
        city: city,
        state: state,
        postal_code: postalCode,
        birth_month: birthMonth,
        birth_day: birthDay,
        birth_year: birthYear,
        position: memberData.position || "",
        department: memberData.department || "",
        service_year: memberData.service_year || ""
      });
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    if (!member) return;
    
    try {
      const { error } = await supabase
        .from('members')
        .update({ profile_image_url: null })
        .eq('id', member.id);

      if (error) throw error;

      setImagePreview('');
      setImageFile(null);
      toast({
        title: "Success",
        description: "Profile image removed",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!member) return;
    
    try {
      setUploading(true);
      
      let profileImageUrl = member.profile_image_url;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${member.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('member-profiles')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('member-profiles')
          .getPublicUrl(fileName);
        
        profileImageUrl = publicUrl;
      }

      // Prepare member data
      const fullName = `${values.first_name} ${values.last_name || ''}`.trim();
      // Build address: street|||line2|||city|||state|||zip
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

      const memberData = {
        name: fullName,
        suffix: values.suffix && values.suffix !== "none" ? values.suffix : null,
        address: fullAddress,
        phone: fullPhone,
        email: values.email,
        date_of_birth: birthDate,
        gender: values.gender,
        baptized: values.baptized === "yes" ? true : values.baptized === "no" ? false : null,
        position: values.position,
        department: values.department || null,
        service_year: values.service_year || null,
        profile_image_url: profileImageUrl
      };

      const { error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      navigate(`/members/${member.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to edit this profile. You can only edit your own profile unless you are an administrator.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/members/${member.id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile Image Section */}
            <div className="mb-8">
              <Label className="text-base font-semibold mb-4 block">Profile Image</Label>
              <div className="flex items-start gap-6">
                <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-20 h-20 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="max-w-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
                  </div>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-[1fr_1fr_100px] gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="suffix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suffix</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="Jr.">Jr.</SelectItem>
                              <SelectItem value="Sr.">Sr.</SelectItem>
                              <SelectItem value="II">II</SelectItem>
                              <SelectItem value="III">III</SelectItem>
                              <SelectItem value="IV">IV</SelectItem>
                              <SelectItem value="V">V</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Baptized</FormLabel>
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

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="birth_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Month *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MM" maxLength={2} />
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
                          <FormLabel>Birth Day *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="DD" maxLength={2} />
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
                          <FormLabel>Birth Year *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="YYYY" maxLength={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="area_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area Code *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="301" maxLength={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1234567" maxLength={10} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
                  <FormField
                    control={form.control}
                    name="street_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Street Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
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
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="21044" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Church Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Church Information</h3>
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Year (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 2020" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProfileEdit;
