import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";
import { Link } from "react-router-dom";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  image_url?: string;
  slug: string;
  display_order: number;
  biography_content?: string;
}

const Staff = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_staff_biographies');
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Our Staff</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">
            Meet our dedicated spiritual leaders who guide and shepherd our congregation
          </p>
        </div>
      </section>

      {/* Staff List */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No staff members found.</p>
            </div>
          ) : (
            <div className="space-y-16 divide-y divide-border [&>*:not(:first-child)]:pt-16">
              {staff.map((member, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={member.id}
                    className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-12 items-start`}
                  >
                    {/* Image */}
                    <div className="w-full md:w-5/12 flex-shrink-0">
                      <Link to={`/staff/${member.slug}`} className="block">
                        <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-muted to-muted/50">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <User className="w-24 h-24 text-primary/40" />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Text */}
                    <div className="w-full md:w-7/12">
                      <p className="text-primary font-semibold italic text-lg mb-1">{member.role}</p>
                      <Link to={`/staff/${member.slug}`}>
                        <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 hover:text-primary transition-colors">
                          {member.name}
                        </h2>
                      </Link>
                      {member.biography_content && (
                        <div className="text-muted-foreground leading-relaxed space-y-4 text-sm md:text-base">
                          {member.biography_content.split('\n').filter(Boolean).map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Staff;
