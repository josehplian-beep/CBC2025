import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, User, ZoomIn } from "lucide-react";
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
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchMemberData();
    }
  }, [slug]);

  const fetchMemberData = async () => {
    try {
      // Convert slug back to name (replace underscores with spaces)
      const memberName = slug!.replace(/_/g, ' ');

      // Fetch member by name
      const { data, error } = await supabase
        .from("department_members")
        .select("*")
        .eq("name", memberName)
        .order("year_range", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Find a record with a profile image, or use first
        const recordWithImage = data.find(d => d.profile_image_url) || data[0];

        let signedImageUrl = recordWithImage.profile_image_url;
        if (signedImageUrl) {
          const url = await getSignedUrl("department-photos", signedImageUrl);
          signedImageUrl = url;
        }

        setMember({
          id: recordWithImage.id,
          name: recordWithImage.name,
          profile_image_url: signedImageUrl,
        });

        setPositionHistory(data);
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

  const uniqueDepartments = Array.from(new Set(positionHistory.map(p => p.department)));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8 gap-2 group hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div 
                    className="w-40 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-border relative group cursor-pointer"
                    onClick={() => member.profile_image_url && setPhotoOpen(true)}
                  >
                    {member.profile_image_url ? (
                      <>
                        <img 
                          src={member.profile_image_url} 
                          alt={member.name}
                          className="w-full h-full object-cover pointer-events-none select-none"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-20 h-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-4xl font-display font-bold mb-2 text-foreground">
                      {member.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">Church Member</p>
                  </div>

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

          <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <CardTitle className="text-2xl font-display">Position History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
                <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
                    <div className="font-bold text-sm uppercase tracking-wide">Department</div>
                    <div className="font-bold text-sm uppercase tracking-wide">Position</div>
                    <div className="font-bold text-sm uppercase tracking-wide">Year</div>
                  </div>
                </div>

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

      {/* Photo Lightbox */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-2xl p-2 bg-background/95 backdrop-blur-sm border-border">
          {member.profile_image_url && (
            <img 
              src={member.profile_image_url} 
              alt={member.name}
              className="w-full h-auto rounded-lg object-contain max-h-[80vh] pointer-events-none select-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MemberProfileDepartment;
