import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffBiography {
  id: string;
  name: string;
  role: string;
  email?: string;
  image_url?: string;
  biography_content: string;
  ministry_focus?: string[];
  spouse_name?: string;
  children_count?: number;
  hobbies?: string;
}

const StaffBiography = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffBiography | null>(null);
  const [loading, setLoading] = useState(true);
  const [enlargedText, setEnlargedText] = useState(false);

  useEffect(() => {
    fetchStaffBiography();
  }, [slug]);

  const fetchStaffBiography = async () => {
    if (!slug) return;

    setLoading(true);
    // Use secure function which returns public staff data (excludes phone)
    const { data, error } = await supabase.rpc('get_public_staff_biographies');
    
    if (error) {
      toast.error('Staff biography not found');
      navigate('/staff');
      return;
    }

    // Find the specific staff member by slug
    const staffMember = data?.find((s: any) => s.slug === slug);
    if (staffMember) {
      setStaff(staffMember as any);
    } else {
      toast.error('Staff biography not found');
      navigate('/staff');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Staff Member Not Found</h1>
          <Button onClick={() => navigate('/about')}>Back to About</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-secondary">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/about")}
            className="mb-6"
          >
            ← Back to Staff
          </Button>
          
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {staff.image_url && (
              <div className="flex justify-center">
                <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl bg-muted">
                  <img 
                    src={staff.image_url} 
                    alt={staff.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {staff.name}
              </h1>
              <p className="text-2xl text-primary font-semibold mb-6">
                {staff.role}
              </p>
              
              <div className="space-y-3 mb-8">
                {staff.email && (
                  <a 
                    href={`mailto:${staff.email}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{staff.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biography Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">Biography</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnlargedText(!enlargedText)}
              className="flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              {enlargedText ? "Normal Text" : "Enlarge Text"}
            </Button>
          </div>
          
          <div 
            className={`max-w-none transition-all ${
              enlargedText ? "text-xl leading-relaxed" : "text-base leading-relaxed"
            }`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {staff.biography_content.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
              } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                return <em key={idx}>{part.slice(1, -1)}</em>;
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>

          {staff.spouse_name && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-muted-foreground">
                {staff.spouse_name && `Married to ${staff.spouse_name}`}
                {staff.children_count && ` with ${staff.children_count} ${staff.children_count === 1 ? 'child' : 'children'}`}.
              </p>
              {staff.hobbies && (
                <p className="text-muted-foreground mt-2">
                  Enjoys {staff.hobbies}.
                </p>
              )}
            </div>
          )}

          {staff.ministry_focus && staff.ministry_focus.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="font-display text-2xl font-bold mb-4">Ministry Focus</h3>
              <ul className="space-y-3 text-muted-foreground">
                {staff.ministry_focus.map((focus, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>{focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StaffBiography;
