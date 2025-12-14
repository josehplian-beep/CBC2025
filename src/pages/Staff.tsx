import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
interface StaffMember {
  id: string;
  name: string;
  role: string;
  image_url?: string;
  slug: string;
  display_order: number;
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
      // Use secure function which returns public staff data (excludes email/phone)
      const { data, error } = await supabase.rpc('get_public_staff_biographies');
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Our Staffs</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">
            Meet our dedicated spiritual leaders who guide and shepherd our congregation
          </p>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="py-20 bg-background" id="staff-members">
        <div className="container mx-auto px-4">
          {loading ? <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : staff.length === 0 ? <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No staff members found.</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {staff.map(member => <StaffCard key={member.id} name={member.name} role={member.role} image={member.image_url} profileLink={`/staff/${member.slug}`} />)}
            </div>}
        </div>
      </section>

      <Footer />
    </div>;
};
export default Staff;