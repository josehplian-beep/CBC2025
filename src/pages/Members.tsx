import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, MapPin, Phone, User, AlertTriangle, Loader2, Download, Plus, Filter, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

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
  const [newMember, setNewMember] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    date_of_birth: "",
    church_groups: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

  const handleAddMember = async () => {
    try {
      const churchGroupsArray = newMember.church_groups
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      const { error } = await supabase
        .from('members')
        .insert([{
          name: newMember.name,
          address: newMember.address || null,
          phone: newMember.phone || null,
          email: newMember.email || null,
          date_of_birth: newMember.date_of_birth || null,
          church_groups: churchGroupsArray.length > 0 ? churchGroupsArray : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setIsAddDialogOpen(false);
      setNewMember({
        name: "",
        address: "",
        phone: "",
        email: "",
        date_of_birth: "",
        church_groups: ""
      });
      
      checkAccessAndLoadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
            <div className="flex gap-2">
              <Button onClick={handleExportToExcel} variant="outline" disabled={filteredMembers.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              {isAdmin && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Member</DialogTitle>
                      <DialogDescription>
                        Add a new member to the church directory
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={newMember.date_of_birth}
                          onChange={(e) => setNewMember({ ...newMember, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={newMember.address}
                          onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                          placeholder="123 Main St, City, State ZIP"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="church_groups">Church Groups/Activities</Label>
                        <Textarea
                          id="church_groups"
                          value={newMember.church_groups}
                          onChange={(e) => setNewMember({ ...newMember, church_groups: e.target.value })}
                          placeholder="Youth Group, Choir, Volunteer (comma separated)"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate multiple groups with commas
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddMember} disabled={!newMember.name}>
                        Add Member
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Members;
