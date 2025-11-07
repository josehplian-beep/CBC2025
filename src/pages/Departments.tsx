import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MigrateDepartments } from "@/components/MigrateDepartments";
import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("deacons");
  const [yearFilter, setYearFilter] = useState("current");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [selectedDepartment]);

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
          {/* Year Filter */}
          <div className="max-w-md mx-auto mb-8">
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
          <Tabs defaultValue="deacons" className="w-full" onValueChange={setSelectedDepartment}>
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 lg:grid-cols-9 mb-8">
              <TabsTrigger value="deacons">Deacons</TabsTrigger>
              <TabsTrigger value="women">Women</TabsTrigger>
              <TabsTrigger value="youth">Youth</TabsTrigger>
              <TabsTrigger value="children">Children</TabsTrigger>
              <TabsTrigger value="mission">Mission</TabsTrigger>
              <TabsTrigger value="building">Building</TabsTrigger>
              <TabsTrigger value="culture">Culture</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="auditors">Auditors</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedDepartment}>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {members.map((member) => (
                    <StaffCard 
                      key={member.id} 
                      name={member.name}
                      role={member.role}
                      image={member.profile_image_url}
                    />
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
      <MigrateDepartments />
    </div>
  );
};

export default Departments;
