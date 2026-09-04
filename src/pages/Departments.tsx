import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getBatchSignedUrls } from "@/hooks/useSignedUrl";

import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("tab") || "deacons");
  const [yearFilter, setYearFilter] = useState("2026-2027");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  const yearRanges = ["2026-2027", "2024-2025", "2023-2024"];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchMembers();
    }
  }, [selectedDepartment, yearFilter]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("department");

      if (error) throw error;

      const uniqueDepts = Array.from(new Set(data?.map(m => m.department) || []));
      const orderedDepts = [
        "deacons", "women", "youth", "children", "praise-&-worship",
        "mission", "building", "culture", "media", "auditors"
      ].filter(d => uniqueDepts.includes(d));
      
      const additionalDepts = uniqueDepts.filter(d => !orderedDepts.includes(d)).sort();
      setDepartments([...orderedDepts, ...additionalDepts]);
      
      if (orderedDepts.length > 0 && !selectedDepartment) {
        setSelectedDepartment(orderedDepts[0]);
      }
    } catch (error) {
      // Silently handle fetch error
    }
  };

  const formatDepartmentName = (dept: string) => {
    const nameMap: Record<string, string> = {
      "deacons": "Deacon",
      "women": "Women",
      "youth": "Youth",
      "children": "Church School",
      "praise-&-worship": "Worship Team",
      "mission": "Mission",
      "building": "Building",
      "culture": "Culture",
      "media": "Media Team",
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
        .eq("year_range", yearFilter)
        .order("display_order");

      if (error) throw error;
      
      // Show members immediately, then load images
      const rawMembers = data || [];
      setMembers(rawMembers);
      setLoading(false);

      // Batch sign all URLs in a single API call (much faster)
      const paths = rawMembers.map(m => m.profile_image_url);
      const signedUrls = await getBatchSignedUrls("department-photos", paths);
      
      const membersWithUrls = rawMembers.map((member, i) => ({
        ...member,
        profile_image_url: signedUrls[i] || member.profile_image_url,
      }));
      setMembers(membersWithUrls);
    } catch (error) {
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
          {/* Year Filter */}
          <div className="max-w-md mx-auto mb-8">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearRanges.map(range => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ministry Tabs */}
          <Tabs value={selectedDepartment} className="w-full" onValueChange={(val) => {
              setSelectedDepartment(val);
              setSearchParams({ tab: val });
            }}>
            <div className="flex flex-col md:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto">
              {/* Mobile dropdown selector */}
              <div className="md:hidden">
                <Select value={selectedDepartment} onValueChange={(val) => {
                    setSelectedDepartment(val);
                    setSearchParams({ tab: val });
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{formatDepartmentName(dept)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop vertical tab sidebar */}
              <TabsList className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:sticky md:top-24 self-start w-full overflow-x-auto md:overflow-visible gap-1.5 h-auto bg-muted/50 p-2 rounded-xl scrollbar-none">
                {departments.map(dept => (
                  <TabsTrigger
                    key={dept}
                    value={dept}
                    className="justify-start shrink-0 md:w-full px-4 py-2.5 rounded-lg text-left whitespace-nowrap font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground"
                    title={formatDepartmentName(dept)}
                  >
                    <span className="truncate">{formatDepartmentName(dept)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 min-w-0">
            <TabsContent value={selectedDepartment} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
                      <div className="flex flex-col items-center">
                        <Skeleton className="w-48 h-48 rounded-lg mb-4" />
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      onClick={() => navigate(`/department-member/${member.name.replace(/\s+/g, '_')}?from=${selectedDepartment}`)}
                      className="cursor-pointer"
                    >
                      <StaffCard 
                        name={member.name}
                        role={member.role}
                        image={member.profile_image_url}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Departments;
