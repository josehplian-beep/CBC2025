import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface PositionHistory {
  id: string;
  department: string;
  role: string;
  year_range: string;
}

interface MemberProfile {
  id: string;
  name: string;
  profile_image_url?: string;
}

const MemberProfileDepartment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMemberData();
    }
  }, [id]);

  const fetchMemberData = async () => {
    try {
      // Fetch all records for this member to get their position history
      const { data, error } = await supabase
        .from("department_members")
        .select("*")
        .eq("id", id);

      if (error) throw error;

      if (data && data.length > 0) {
        // Set member info from first record
        setMember({
          id: data[0].id,
          name: data[0].name,
          profile_image_url: data[0].profile_image_url,
        });

        // Fetch all positions for this member name across all departments and years
        const { data: allPositions, error: historyError } = await supabase
          .from("department_members")
          .select("*")
          .eq("name", data[0].name)
          .order("year_range", { ascending: false });

        if (historyError) throw historyError;

        setPositionHistory(allPositions || []);
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Member not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Get unique departments for badges
  const uniqueDepartments = Array.from(new Set(positionHistory.map(p => p.department)));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8 gap-2 group hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Member Header Card */}
          <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Square Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-border">
                    {member.profile_image_url ? (
                      <img 
                        src={member.profile_image_url} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-20 h-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-4xl font-display font-bold mb-2 text-foreground">
                      {member.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">Church Member</p>
                  </div>

                  {/* Department Badges */}
                  {uniqueDepartments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Departments:</p>
                      <div className="flex flex-wrap gap-2">
                        {uniqueDepartments.map((dept) => (
                          <Badge 
                            key={dept} 
                            variant="secondary"
                            className="px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {formatDepartmentName(dept)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Role Badge */}
                  {positionHistory.length > 0 && (
                    <div className="pt-2">
                      <Badge 
                        variant="default"
                        className="px-4 py-1.5 text-sm font-semibold"
                      >
                        {positionHistory[0].role}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leadership History Card */}
          <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <CardTitle className="text-2xl font-display">Leadership History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
                    <div className="font-bold text-sm uppercase tracking-wide">Department</div>
                    <div className="font-bold text-sm uppercase tracking-wide">Position</div>
                    <div className="font-bold text-sm uppercase tracking-wide">Year</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/30">
                  {positionHistory.length > 0 ? (
                    positionHistory.map((position, index) => (
                      <div 
                        key={position.id}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {formatDepartmentName(position.department)}
                        </div>
                        <div className="text-muted-foreground font-medium">
                          {position.role}
                        </div>
                        <div className="text-muted-foreground">
                          <Badge variant="outline" className="font-mono">
                            {position.year_range}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No leadership history available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MemberProfileDepartment;
