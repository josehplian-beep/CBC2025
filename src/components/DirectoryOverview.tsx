import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Users, Search, ArrowRight, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Department {
  name: string;
  count: number;
}

interface Member {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  profile_image_url: string | null;
}

export const DirectoryOverview = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    loadDirectoryData();
  }, []);

  const loadDirectoryData = async () => {
    try {
      // Get total members count
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      setTotalMembers(membersCount || 0);

      // Get department counts from members
      const { data: membersData } = await supabase
        .from('members')
        .select('department');
      
      if (membersData) {
        const deptCounts: { [key: string]: number } = {};
        membersData.forEach(m => {
          if (m.department) {
            deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
          }
        });
        
        const depts = Object.entries(deptCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        
        setDepartments(depts);
      }

      // Get recent members (those with profile images first)
      const { data: recentData } = await supabase
        .from('members')
        .select('id, name, department, position, profile_image_url')
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (recentData) {
        // Prioritize members with profile images
        const withImages = recentData.filter(m => m.profile_image_url);
        const withoutImages = recentData.filter(m => !m.profile_image_url);
        setRecentMembers([...withImages, ...withoutImages].slice(0, 8));
      }
    } catch (error) {
      console.error("Error loading directory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/members?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Loading directory...</p>
      </div>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold mb-4">Church Directory</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with our community. Browse departments and member profiles.
          </p>
        </div>

        {/* Quick Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for members, departments, or positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-32 h-14 text-lg"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/members')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Members Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">{totalMembers}</span>
                <span className="text-muted-foreground">total members</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Browse our complete member directory with advanced search and filtering options
              </p>
              <Button variant="link" className="p-0 h-auto">
                View all members <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/departments')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">{departments.length}</span>
                <span className="text-muted-foreground">active departments</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Explore our ministry departments and the dedicated members serving in each
              </p>
              <Button variant="link" className="p-0 h-auto">
                View departments <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Departments Grid */}
        {departments.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Departments</h3>
              <Button variant="ghost" onClick={() => navigate('/departments')}>
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <Card
                  key={dept.name}
                  className="hover:shadow-md transition-all cursor-pointer hover:border-primary"
                  onClick={() => navigate('/departments')}
                >
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-semibold mb-2">{dept.name}</h4>
                    <Badge variant="secondary">{dept.count} members</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Members */}
        {recentMembers.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Featured Members</h3>
              <Button variant="ghost" onClick={() => navigate('/members')}>
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/members/${member.id}`)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                    {member.profile_image_url ? (
                      <img
                        src={member.profile_image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                    {member.name}
                  </p>
                  {member.position && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-1">
                      {member.position}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
