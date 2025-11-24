import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {/* Member Info Section */}
            <div className="flex flex-col items-center text-center mb-12">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-6 bg-muted">
                {member.profile_image_url ? (
                  <img 
                    src={member.profile_image_url} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{member.name}</h1>
            </div>

            {/* Position History Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Position History</h2>
              
              <div className="rounded-lg overflow-hidden border border-border">
                {/* Table Header with Gradient */}
                <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
                  <div className="grid grid-cols-3 gap-4 p-4 font-semibold">
                    <div>Department</div>
                    <div>Position</div>
                    <div>Year</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {positionHistory.length > 0 ? (
                    positionHistory.map((position, index) => (
                      <div 
                        key={position.id}
                        className={`grid grid-cols-3 gap-4 p-4 transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <div className="font-medium">{formatDepartmentName(position.department)}</div>
                        <div className="text-muted-foreground">{position.role}</div>
                        <div className="text-muted-foreground">{position.year_range}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No position history available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default MemberProfileDepartment;
