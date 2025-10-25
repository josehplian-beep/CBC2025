import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("deacons");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('department_members')
      .select('*')
      .order('department', { ascending: true })
      .order('display_order', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  // Group members by department
  const departmentGroups: Record<string, any[]> = {
    deacons: [],
    women: [],
    youth: [],
    children: [],
    mission: [],
    building: [],
    culture: [],
    media: [],
    auditors: [],
  };

  members.forEach((member) => {
    if (departmentGroups[member.department]) {
      departmentGroups[member.department].push(member);
    }
  });

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
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              Object.entries(departmentGroups).map(([key, deptMembers]) => {
                const filteredMembers = deptMembers.filter((member: any) =>
                  member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  member.role.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <TabsContent key={key} value={key}>
                    {filteredMembers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredMembers.map((member: any) => (
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
                        <p className="text-muted-foreground">No staff found in this department</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })
            )}
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Departments;
