import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MigrateDepartments } from "@/components/MigrateDepartments";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState("deacons");
  const [yearFilter, setYearFilter] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchMembers();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    // Filter members based on search query
    if (searchQuery.trim()) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("department");

      if (error) throw error;

      const uniqueDepts = Array.from(new Set(data?.map(m => m.department) || []));
      const orderedDepts = [
        "deacons", "women", "youth", "children", "praise-worship",
        "mission", "building", "culture", "media", "auditors"
      ].filter(d => uniqueDepts.includes(d));
      
      const additionalDepts = uniqueDepts.filter(d => !orderedDepts.includes(d)).sort();
      setDepartments([...orderedDepts, ...additionalDepts]);
      
      if (orderedDepts.length > 0 && !selectedDepartment) {
        setSelectedDepartment(orderedDepts[0]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const formatDepartmentName = (dept: string) => {
    const nameMap: Record<string, string> = {
      "deacons": "Deacon",
      "women": "Women",
      "youth": "Youth",
      "children": "Children",
      "praise-worship": "Praise & Worship",
      "mission": "Mission",
      "building": "Building",
      "culture": "Culture",
      "media": "Media",
      "auditors": "Auditors"
    };
    return nameMap[dept] || dept.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("*")
        .eq("department", selectedDepartment)
        .order("display_order");

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${communityImage})`
        }}>
          <div className="absolute inset-0 bg-neutral-900" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Departments</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Meet the dedicated servants leading our church family
          </p>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Departments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Filters Section */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Year Filter */}
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Year</SelectItem>
                <SelectItem value="2023-2025">2023-2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ministry Tabs */}
          <Tabs value={selectedDepartment} className="w-full" onValueChange={setSelectedDepartment}>
            <TabsList className="flex flex-wrap justify-center gap-2 max-w-6xl mx-auto mb-8 h-auto bg-muted/50 p-3 rounded-xl">
              {departments.map(dept => (
                <TabsTrigger 
                  key={dept} 
                  value={dept} 
                  className="px-4 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] font-medium"
                  title={formatDepartmentName(dept)}
                >
                  <span className="truncate block">{formatDepartmentName(dept)}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedDepartment}>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : filteredMembers.length > 0 ? (
                <>
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground">
                      {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
                      {searchQuery && ` for "${searchQuery}"`}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="cursor-pointer"
                        onClick={() => member.member_id && navigate(`/members/${member.member_id}`)}
                      >
                        <StaffCard 
                          name={member.name}
                          role={member.role}
                          image={member.profile_image_url}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? `No members found for "${searchQuery}"` : 'No members found'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
      <MigrateDepartments />
    </div>
  );
};

export default Departments;
