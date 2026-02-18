import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState("deacons");
  const [yearFilter, setYearFilter] = useState("2026-2027");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  const yearRanges = ["2026-2027", "2024-2025", "2022-2023", "2020-2021", "2018-2019"];

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
        "deacons", "women", "youth", "children", "praise-worship",
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
      "praise-worship": "Worship Team",
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
        .eq("year_range", yearFilter)
        .order("display_order");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      // Silently handle fetch error
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
              ) : members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      onClick={() => navigate(`/department-member/${member.id}`)}
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
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Departments;
